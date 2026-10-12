module.exports = function scenarios() {
      const rb = window.__rb, checks = [];
      const check = (ok, label) => {if(!ok)throw Error(label);checks.push(label);};
      const h = rb.newHero('Testhero','concord','human','warrior');
      Object.assign(h,{lvl:20,zone:'fens',xp:0});
      h.dstats={clears:5,best:2,runs:7};
      h.dun={tier:1,step:2,mods:[],wipes:0};
      rb.S.chars=[h];rb.S.cur=h.id;rb.boot();
      check(h.dun.id==='sanctum','old dungeon run gains Sanctum identity');
      check(rb.dungeonStats('sanctum').best===2,'old Sanctum Heroic progress preserved');
      check(rb.dungeonStats('foundry').best===-1,'Foundry progression starts locked');
      h.dun=null;rb.boot();rb.gainXP(rb.xpNeed(20),false);
      check(h.lvl===21,'previously capped hero levels to 21');
      for(const [zone,qs] of Object.entries(rb.QUESTS))for(const q of qs){
        check(rb.ZONES[zone].mobs.some(m=>m.id===q.mob),'quest target exists: '+q.id);
        check(!q.req||Object.values(rb.QUESTS).flat().some(p=>p.id===q.req),'quest prerequisite exists: '+q.id);
      }
      h.zone='ashen';h.lvl=30;rb.boot();
      for(const q of rb.QUESTS.ashen){
        check(rb.qState(q)==='avail','quest available: '+q.id);
        rb.accept(q.id);h.quests.prog[q.id]=q.n;rb.turnIn(q.id,0,false);
        check(h.quests.done[q.id],'quest completed: '+q.id);
      }
      h.lvl=59;h.xp=0;rb.boot();rb.gainXP(rb.xpNeed(59)*10,false);
      check(h.lvl===60&&h.xp===0,'XP stops at level 60');
      check(h.npcs.every(n=>rb.npcZone(n)==='crownheart'),'high-level companions visit the Crown heart');
      h.lvl=27;for(const n of h.npcs)n.offset=0;
      check(h.npcs.every(n=>rb.npcZone(n)==='ashen'),'level-27 companions still visit Ashen Ridge');
      h.lvl=30;rb.boot();
      const party=h.npcs.slice(0,4).map(n=>n.id);
      rb.startDungeon(1,party,'foundry');check(!h.dun,'uncleared Foundry cannot enter Heroic');
      rb.startDungeon(0,[party[0],party[0],party[1],party[2]],'foundry');check(!h.dun,'duplicate party rejected');
      h.zone='fens';rb.startDungeon(0,party,'foundry');check(!h.dun,'Foundry requires Ashen Ridge');
      h.zone='ashen';rb.startDungeon(0,party,'foundry');check(h.dun.id==='foundry','Foundry normal entry');
      rb.spawnDungeon();check(rb.C.mob.name.startsWith('Foundry Overseers'),'Foundry uses its own encounters');
      for(let i=0;i<rb.DUNGEONS.foundry.enc.length;i++){h.dun.step=i;rb.spawnDungeon();check(rb.C.mob.name.includes(rb.DUNGEONS.foundry.enc[i].name),'Foundry encounter '+i);}
      rb.finishDungeon();
      check(rb.dungeonStats('foundry').clears===1&&rb.dungeonStats('foundry').best===0,'Foundry clear unlocks Heroic 1');
      check(rb.dungeonStats('sanctum').clears===5&&rb.dungeonStats('sanctum').best===2,'Foundry clear leaves Sanctum record intact');
      rb.startDungeon(1,party,'foundry');check(h.dun.tier===1&&h.dun.mods.length===1,'earned Foundry Heroic entry with modifier');
      h.dun=null;h.zone='fens';rb.boot();rb.startDungeon(3,party,'sanctum');check(h.dun.id==='sanctum','migrated Sanctum Heroic unlock usable');
      const hunter=rb.newHero('Ashhunter','wild','grishar','hunter');hunter.lvl=30;hunter.zone='ashen';hunter.grind='coalmaw';
      rb.S.chars.push(hunter);rb.S.cur=hunter.id;rb.boot();rb.spawn();
      check(rb.C.mob.id==='coalmaw'&&rb.C.mob.rar===4,'Coalmaw spawns as a legendary tameable beast');
      rb.startTame();check(!!rb.C.taming,'Hunter can begin taming Coalmaw');rb.finishTame();
      check(hunter.pets.length===1&&hunter.pets[0].family==='boar'&&hunter.pets[0].rar===4,'Coalmaw joins the Hunter stable with legendary rarity');
      const legacy=rb.migrate({hero:hunter,last:1234});check(legacy.chars.length===1&&legacy.cur===hunter.id,'legacy single-hero save migrates');
      for(const faction of ['concord','wild']){
        const winter=rb.newHero('Wintercheck',faction,faction==='concord'?'human':'grishar','hunter');
        winter.lvl=40;winter.zone='frostmere';rb.S.chars.push(winter);rb.S.cur=winter.id;rb.boot();
        check(document.querySelector('#zoneLore').textContent.includes(rb.ZONES.frostmere.lore),'Frostmere lore visible: '+faction);
        check(document.body.textContent.includes(rb.ZONES.frostmere.hub[faction]),'correct winter hub visible: '+faction);
        const chain=rb.QUESTS.frostmere;
        for(const q of chain){
          winter.bags=[];
          check(rb.qState(q)==='avail','winter quest available: '+q.id+' '+faction);
          rb.accept(q.id);rb.spawn();
          check(rb.C.mob.id===q.mob,'winter quest selects target: '+q.id+' '+faction);
          winter.quests.prog[q.id]=q.n;rb.turnIn(q.id,0,false);
          const voice=q.done[faction==='concord'?0:1],speaker=q.giver[faction==='concord'?0:1];
          check(winter.quests.done[q.id]&&rb.C.lines.some(l=>l.txt.includes(speaker+': "'+voice+'"')),'winter turn-in voice: '+q.id+' '+faction);
          check(winter.bags.length===1&&winter.bags[0].ilvl>=q.lvl,'winter reward scales: '+q.id+' '+faction);
        }
        rb.S.tab='quests';rb.boot(); // the check reads the Quests tab, whatever tab the save was left on
        check(document.body.textContent.includes('10/10 quests done in Frostmere'),'winter completion visible: '+faction);
        winter.grind='hushfang';rb.boot();rb.spawn();
        check(rb.C.mob.id==='hushfang'&&rb.C.mob.rar===4&&rb.C.mob.elite,'Hushfang spawns legendary: '+faction);
        rb.startTame();check(!!rb.C.taming,'Hushfang tame begins: '+faction);rb.finishTame();
        check(winter.pets.length===1&&winter.pets[0].family==='wolf'&&winter.pets[0].rar===4,'Hushfang joins stable: '+faction);
      }
      const barrows=rb.DUNGEONS.barrows,field=rb.ZONES.barrowfield;
      check(field.lv[0]===40&&field.lv[1]===45&&field.faction===null,'Barrowfields is a shared level 40-45 zone');
      check(field.mobs.length===6&&field.mobs.filter(m=>m.elite).length===1,'Barrowfields has five ordinary mobs and one elite');
      check(new Set(Object.values(rb.QUESTS).flat().map(q=>q.id)).size===Object.values(rb.QUESTS).flat().length,'quest IDs stay unique across chapters');
      check(rb.QUESTS.barrowfield.length===12,'Barrowfields has twelve quests');
      check(barrows.minLvl===42&&barrows.zone==='barrowfield','Silent Barrows unlocks at 42 in the Barrowfields');
      check(barrows.enc.filter(e=>!e.boss).length===4&&barrows.enc.filter(e=>e.boss).length===3,'Silent Barrows has four packs and three bosses');
      check(barrows.enc.at(-1).final&&barrows.enc.at(-1).name==='The Last Wayward'&&barrows.enc.at(-1).lvl===45,'Last Wayward is the level-45 finale');
      check(barrows.enc.every(e=>e.lvl>=42&&e.lvl<=45&&(!e.mech||Object.keys(e.mech).every(k=>['wave','surge','enrage','chill'].includes(k)))),'Barrows uses known encounter mechanics (Grave Chill added in T1-B)');
      check(barrows.enc.filter(e=>e.boss).every(e=>e.mech&&e.mech.chill>0),'every Barrows boss uses Grave Chill');
      for(const faction of ['concord','wild']){
        const b=rb.newHero('Barrowcheck',faction,faction==='concord'?'human':'grishar','hunter');
        rb.S.chars.push(b);rb.S.cur=b.id;
        Object.assign(b,{lvl:37,zone:'frostmere',xp:0});rb.boot();
        const travel=()=>document.querySelector('[data-act="zone"][data-arg="barrowfield"]').click();
        travel();check(b.zone==='frostmere','Barrowfields refuses travel at 37: '+faction);
        b.lvl=38;rb.boot();travel();rb.boot();
        check(b.zone==='barrowfield','Barrowfields accepts travel at 38: '+faction);
        check(document.querySelector('#zoneLore').textContent===field.lore,'Barrowfields lore visible: '+faction);
        check(document.body.textContent.includes(field.hub[faction]),'Barrowfields faction hub visible: '+faction);
        for(const n of b.npcs)n.offset=0;
        b.lvl=39;check(b.npcs.every(n=>rb.npcZone(n)==='frostmere'),'level-39 companions retain Frostmere: '+faction);
        b.lvl=40;check(b.npcs.every(n=>rb.npcZone(n)==='barrowfield'),'level-40 companions visit Barrowfields: '+faction);
        // Round-trip an old-cap save with completed quests and separate dungeon records.
        b.quests.done.fm10=true;b.drecords={sanctum:{clears:2,best:1,runs:3},foundry:{clears:1,best:0,runs:1}};
        rb.boot();rb.save();
        const resumed=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1')));
        const old=resumed.chars.find(c=>c.id===b.id);rb.S.chars=resumed.chars;rb.S.cur=old.id;rb.boot();
        check(old.lvl===40&&old.quests.done.fm10&&rb.dungeonStats('foundry').clears===1&&rb.dungeonStats('sanctum').best===1,'level-40 save preserves chapter and dungeon progress: '+faction);
        rb.gainXP(Math.ceil(rb.xpNeed(40)/.6),false);
        check(old.lvl===41,'old level-40 save earns XP to 41: '+faction);
        old.lvl=45;rb.boot();
        for(const q of rb.QUESTS.barrowfield){
          old.bags=[];old.grind=null;
          check(q.type!=='collect'||field.mobs.find(m=>m.id===q.mob).drop,'collection target carries its quest item: '+q.id+' '+faction);
          check(!q.req||old.quests.done[q.req],'Barrowfields chain prerequisite completed: '+q.id+' '+faction);
          old.lvl=q.lvl-3;check(rb.qState(q)==='locked','quest locked below level-minus-two: '+q.id+' '+faction);
          old.lvl=q.lvl-2;check(rb.qState(q)==='avail','quest opens at level-minus-two: '+q.id+' '+faction);
          rb.accept(q.id);rb.boot();rb.spawn();
          check(old.quests.active.includes(q.id)&&rb.C.mob.id===q.mob,'Barrowfields quest accepted and selects target: '+q.id+' '+faction);
          old.quests.prog[q.id]=q.n;rb.turnIn(q.id,0,false);
          const i=faction==='concord'?0:1;
          check(old.quests.done[q.id]&&rb.C.lines.some(l=>l.txt.includes(q.giver[i]+': "'+q.done[i]+'"')),'Barrowfields turn-in voice: '+q.id+' '+faction);
          check(old.bags.length===1&&old.bags[0].ilvl===q.lvl+(q.elite?2:1)&&old.bags[0].rar===(q.elite?3:2),'Barrowfields exact scaled reward: '+q.id+' '+faction);
        }
        check(rb.QUESTS.barrowfield.at(-1).text.includes('Silent Barrows'),'last quest sends player to Silent Barrows: '+faction);
        old.lvl=45;old.grind='paleweft';rb.boot();rb.spawn();
        check(rb.C.mob.id==='paleweft'&&rb.C.mob.elite&&rb.C.mob.rar===4,'Paleweft spawns legendary: '+faction);
        rb.startTame();check(!!rb.C.taming,'Paleweft taming begins: '+faction);rb.finishTame();
        check(old.pets.some(p=>p.family==='spider'&&p.rar===4),'Paleweft joins Hunter stable: '+faction);
        old.grind=null;old.lvl=41;rb.boot();document.querySelector('[data-act="tab"][data-arg="friends"]').click();
        check(document.querySelector('[data-act="lfg"][data-arg="barrows"]').disabled,'Barrows group finder locked at 41: '+faction);
        old.lvl=42;rb.boot();document.querySelector('[data-act="tab"][data-arg="friends"]').click();
        check(!document.querySelector('[data-act="lfg"][data-arg="barrows"]').disabled,'Barrows appears enabled at 42 in its zone: '+faction);
        const team=old.npcs.slice(0,4).map(n=>n.id);
        old.zone='frostmere';rb.boot();rb.startDungeon(0,team,'barrows');
        check(!old.dun,'Barrows requires its own zone: '+faction);
        old.zone='barrowfield';rb.boot();rb.startDungeon(1,team,'barrows');
        check(!old.dun,'Barrows Heroic requires a normal clear: '+faction);
        rb.startDungeon(0,team,'barrows');
        check(old.dun&&old.dun.id==='barrows','Barrows normal entry at 42: '+faction);
        for(let i=0;i<barrows.enc.length;i++){
          old.dun.step=i;rb.spawnDungeon();const e=barrows.enc[i];
          check(rb.C.mob.name.includes(e.name)&&rb.C.mob.lvl===e.lvl&&rb.C.mob.boss===!!e.boss,'Barrows encounter identity: '+i+' '+faction);
        }
        rb.finishDungeon();
        check(rb.dungeonStats('barrows').clears===1&&rb.dungeonStats('barrows').best===0,'Barrows normal clear unlocks Heroic: '+faction);
        check(rb.dungeonStats('sanctum').best===1&&rb.dungeonStats('foundry').clears===1,'Barrows clear preserves other dungeon records: '+faction);
        rb.startDungeon(1,team,'barrows');
        check(old.dun.id==='barrows'&&old.dun.mods.length===1,'Barrows earned Heroic uses existing modifiers: '+faction);
        old.dun=null;rb.boot();rb.save();
      }
      // T22: the Hollow Crown, old level-45 saves and Rootrot Hollow.
      {
        const crown=rb.ZONES.hollowcrown,rootrot=rb.DUNGEONS.rootrot,chain=rb.QUESTS.hollowcrown;
        check(crown.name==='The Hollow Crown'&&crown.lv[0]===45&&crown.lv[1]===52&&crown.faction===null,'Hollow Crown is a shared level 45-52 zone');
        check(crown.hub.concord==='Thornmantle Camp'&&crown.hub.wild===crown.hub.concord,'both factions share Thornmantle Camp');
        check(crown.lore.includes('empty throne')&&crown.lore.includes('Sundering')&&crown.lore.includes('Ashwing'),'Hollow Crown lore follows the Wayfolk and Ashwing story');
        check(crown.mobs.length===6&&crown.mobs.filter(m=>m.elite).length===1,'Hollow Crown has five ordinary mobs and one elite');
        check(crown.mobs.every(m=>m.lv[0]>=45&&m.lv[1]<=52&&m.lv[0]<=m.lv[1]),'Hollow Crown mob bands stay within 45-52');
        check(crown.mobs.find(m=>m.id==='ashwing').fam==='lizard'&&crown.mobs.find(m=>m.id==='hollowroot').kind==='humanoid','drakes and treants use existing visual kinds');
        check(['wolf','spider','boar'].every(fam=>crown.mobs.some(m=>m.fam===fam&&!m.elite)),'rotting wood contains wolves, spiders and boars');
        check(new Set(Object.values(rb.ZONES).flatMap(z=>z.mobs.map(m=>m.id))).size===Object.values(rb.ZONES).flatMap(z=>z.mobs).length,'surface mob IDs stay unique');
        check(chain.length===12&&chain.every((q,i)=>q.id==='hc'+(i+1)&&q.lvl>=45&&q.lvl<=52),'twelve hc quests cover levels 45-52');
        check(chain.every(q=>Array.isArray(q.giver)&&q.giver.length===2&&q.giver.every(Boolean)&&Array.isArray(q.done)&&q.done.length===2&&q.done.every(Boolean)),'all Hollow Crown quests have paired givers and turn-in voices');
        check(chain.every(q=>['kill','collect'].includes(q.type)&&q.n>0&&(!q.req||(chain.findIndex(p=>p.id===q.req)>=0&&chain.findIndex(p=>p.id===q.req)<chain.indexOf(q)))),'Hollow Crown objectives and prerequisite order are valid');
        check(chain.at(-1).text.includes('Rootrot Hollow')&&chain.at(-1).text.includes('Seraveth'),'final quest points to the dungeon and the later Crown heart');
        const elite=crown.mobs.find(m=>m.elite);
        check(elite.id==='veskareth'&&elite.rare&&elite.lv[0]===52&&elite.lv[1]===52&&elite.fam==='lizard','Veskareth is a level-52 legendary tameable drake');
        check(rootrot.name==='Rootrot Hollow'&&rootrot.minLvl===49&&rootrot.zone==='hollowcrown','Rootrot opens at 49 in the Hollow Crown');
        check(rootrot.enc.filter(e=>!e.boss).length===4&&rootrot.enc.filter(e=>e.boss).length===3,'Rootrot has four packs and three bosses');
        check(rootrot.enc.every(e=>e.lvl>=49&&e.lvl<=52&&(!e.mech||Object.keys(e.mech).every(k=>['wave','surge','enrage'].includes(k)))),'Rootrot uses existing warm-wood mechanics, without Grave Chill');
        check(rootrot.enc.at(-1).final&&rootrot.enc.at(-1).lvl===52&&!rootrot.enc.some(e=>e.name.includes('Seraveth')),'level-52 Rootrot finale leaves Seraveth for the later chapter');
        for(const faction of ['concord','wild']){
          const c=rb.newHero('Crowncheck',faction,faction==='concord'?'human':'grishar','hunter');rb.S.chars.push(c);rb.S.cur=c.id;
          Object.assign(c,{lvl:42,zone:'barrowfield',xp:0});for(const n of c.npcs)n.offset=0;rb.boot();
          const travel=()=>document.querySelector('[data-act="zone"][data-arg="hollowcrown"]').click();
          travel();check(c.zone==='barrowfield','Hollow Crown refuses travel at 42: '+faction);
          c.lvl=43;rb.boot();travel();rb.boot();
          check(c.zone==='hollowcrown','Hollow Crown accepts travel at 43: '+faction);
          check(document.querySelector('#zoneLore').textContent===crown.lore,'Hollow Crown lore visible: '+faction);
          check(document.body.textContent.includes('Thornmantle Camp'),'shared camp visible: '+faction);
          c.lvl=44;check(c.npcs.every(n=>rb.npcZone(n)==='barrowfield'),'level-44 companions retain Barrowfields: '+faction);
          c.lvl=45;check(c.npcs.every(n=>rb.npcZone(n)==='hollowcrown'),'level-45 companions visit Hollow Crown: '+faction);
          c.zone='barrowfield';c.quests.done.bf12=true;c.drecords={sanctum:{clears:2,best:1,runs:3},foundry:{clears:1,best:0,runs:1},barrows:{clears:1,best:0,runs:1}};
          rb.boot();rb.save();const resumed=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1')));
          const old=resumed.chars.find(h=>h.id===c.id);rb.S.chars=resumed.chars;rb.S.cur=old.id;rb.boot();
          check(old.lvl===45&&old.zone==='barrowfield'&&old.quests.done.bf12&&rb.dungeonStats('barrows').clears===1&&rb.dungeonStats('sanctum').best===1,'level-45 save preserves chapter, zone and separate dungeon records: '+faction);
          rb.gainXP(Math.ceil(rb.xpNeed(45)/.6),false);check(old.lvl===46,'old level-45 save earns XP to 46: '+faction);
          travel();rb.boot();
          for(const q of chain){
            old.bags=[];old.grind=null;
            check(q.type!=='collect'||crown.mobs.find(m=>m.id===q.mob).drop,'Hollow Crown collection target has its item: '+q.id+' '+faction);
            if(q.req){delete old.quests.done[q.req];old.lvl=52;check(rb.qState(q)==='locked','Hollow Crown prerequisite actually gates quest: '+q.id+' '+faction);old.quests.done[q.req]=true;}
            old.lvl=q.lvl-3;check(rb.qState(q)==='locked','Hollow Crown quest locked below level-minus-two: '+q.id+' '+faction);
            old.lvl=q.lvl-2;check(rb.qState(q)==='avail','Hollow Crown quest opens at level-minus-two: '+q.id+' '+faction);
            questOffer(q.id);check(!!RTALK&&RTALK.lines[0][1]===q.text&&RTALK.choices.length===2,'Hollow Crown voiced offer and choices: '+q.id+' '+faction);
            SCN.choose(0);rb.boot();rb.spawn();
            check(old.quests.active.includes(q.id)&&rb.C.mob.id===q.mob,'Hollow Crown quest accepts and selects target: '+q.id+' '+faction);
            old.quests.prog[q.id]=q.n;rb.turnIn(q.id,0,false);const i=faction==='concord'?0:1;
            check(old.quests.done[q.id]&&rb.C.lines.some(l=>l.txt.includes(q.giver[i]+': "'+q.done[i]+'"')),'Hollow Crown turn-in voice: '+q.id+' '+faction);
            questThanks(q.id);check(!!RTALK&&RTALK.lines[0][1]===q.done[i],'Hollow Crown portrait thanks uses faction voice: '+q.id+' '+faction);SCN.skip();
            check(old.bags.length===1&&old.bags[0].ilvl===q.lvl+(q.elite?2:1)&&old.bags[0].rar===(q.elite?3:2),'Hollow Crown exact scaled reward: '+q.id+' '+faction);
          }
          rb.S.tab='quests';rb.boot();check(document.body.textContent.includes('12/12 quests done in The Hollow Crown'),'Hollow Crown completion visible: '+faction);
          old.lvl=52;old.grind=elite.id;rb.boot();rb.spawn();
          check(rb.C.mob.id===elite.id&&rb.C.mob.elite&&rb.C.mob.rar===4,'Veskareth spawns legendary: '+faction);
          rb.startTame();check(!!rb.C.taming,'Veskareth taming begins: '+faction);rb.finishTame();
          check(old.pets.some(p=>p.family==='lizard'&&p.rar===4),'Veskareth joins Hunter stable: '+faction);
          old.grind=null;old.lvl=48;rb.boot();document.querySelector('[data-act="tab"][data-arg="friends"]').click();
          check(document.querySelector('[data-act="lfg"][data-arg="rootrot"]').disabled,'Rootrot group finder locked at 48: '+faction);
          const team=old.npcs.slice(0,4).map(n=>n.id);rb.startDungeon(0,team,'rootrot');check(!old.dun,'Rootrot entry rejected below level 49: '+faction);
          old.lvl=49;rb.boot();document.querySelector('[data-act="tab"][data-arg="friends"]').click();
          check(!document.querySelector('[data-act="lfg"][data-arg="rootrot"]').disabled,'Rootrot group finder enabled at 49: '+faction);
          old.zone='barrowfield';rb.boot();rb.startDungeon(0,team,'rootrot');check(!old.dun,'Rootrot requires its own zone: '+faction);
          old.zone='hollowcrown';rb.boot();rb.startDungeon(1,team,'rootrot');check(!old.dun,'Rootrot Heroic requires a normal clear: '+faction);
          rb.startDungeon(0,team,'rootrot');check(old.dun&&old.dun.id==='rootrot','Rootrot normal entry at 49: '+faction);
          for(let i=0;i<rootrot.enc.length;i++){old.dun.step=i;rb.spawnDungeon();const e=rootrot.enc[i];check(rb.C.mob.name.includes(e.name)&&rb.C.mob.lvl===e.lvl&&rb.C.mob.boss===!!e.boss,'Rootrot encounter identity: '+i+' '+faction);}
          rb.finishDungeon();check(rb.dungeonStats('rootrot').clears===1&&rb.dungeonStats('rootrot').best===0,'Rootrot clear unlocks Heroic: '+faction);
          check(rb.dungeonStats('sanctum').best===1&&rb.dungeonStats('foundry').clears===1&&rb.dungeonStats('barrows').clears===1,'Rootrot clear preserves earlier dungeon records: '+faction);
          rb.startDungeon(1,team,'rootrot');check(old.dun.id==='rootrot'&&old.dun.mods.length===1,'Rootrot earned Heroic uses existing modifiers: '+faction);
          old.dun=null;rb.boot();rb.save();
        }
      }
      // T23: the Crown's Heart, Hollow Key gates and the existing raid unlock.
      {
        const z=rb.ZONES.crownheart,d=rb.DUNGEONS.heartwood,qs=rb.QUESTS.crownheart,elite=z.mobs.find(m=>m.elite);
        check(z.name==="The Crown's Heart"&&z.lv[0]===52&&z.lv[1]===60&&z.faction===null,'Crown heart is a shared 52-60 zone');
        check(z.hub.concord==='Heartwatch Camp'&&z.hub.wild===z.hub.concord,'both factions share the inward camp');
        check(['Seraveth','Hollow Throne','Hollow Key','Silent Barrows','Rootrot Hollow'].every(t=>z.lore.includes(t)),'Crown heart lore names the attunement and occupied throne');
        check(Object.values(ZONE_ORDER).every(r=>r.at(-1)==='crownheart'&&r.at(-2)==='hollowcrown'),'both routes append Crown heart');
        check(z.mobs.length===7&&z.mobs.filter(m=>m.elite).length===1,'six ordinary Crown heart mobs and one elite');
        check(z.mobs.every(m=>m.lv[0]>=52&&m.lv[1]<=60&&m.lv[0]<=m.lv[1]),'Crown heart mob bands remain within 52-60');
        check(['wolf','boar','spider','lizard'].every(f=>z.mobs.some(m=>m.fam===f))&&z.mobs.some(m=>m.kind==='humanoid'),'Crown heart mob roles use existing families and treant kind');
        check(new Set(Object.values(rb.ZONES).flatMap(z=>z.mobs.map(m=>m.id))).size===Object.values(rb.ZONES).flatMap(z=>z.mobs).length,'all surface mob IDs remain unique');
        check(elite.id==='aurethyn'&&elite.rare&&elite.fam==='lizard'&&elite.lv.every(l=>l===60),'Aurethyn is a legendary tameable level-60 drake');
        check(qs.length===14&&qs.every((q,i)=>q.id==='ch'+(i+1)&&q.lvl>=52&&q.lvl<=60),'fourteen ch quests cover levels 52-60');
        check(qs.every(q=>q.giver.length===2&&q.done.length===2&&q.giver.every(Boolean)&&q.done.every(Boolean)),'all Crown heart quests have faction givers and turn-in voices');
        check(qs.every(q=>['kill','collect'].includes(q.type)&&q.n>0&&(!q.req||qs.findIndex(p=>p.id===q.req)<qs.indexOf(q)&&qs.some(p=>p.id===q.req))),'Crown heart objectives and prerequisite chains are valid');
        check(qs.slice(-3).every(q=>q.attune&&JSON.stringify(q.needDun)==='["barrows","rootrot"]')&&qs[11].req==='ch11'&&qs[12].req==='ch12'&&qs[13].req==='ch13','three Hollow Key quests require both dungeon clears and chained predecessors');
        check(qs[13].done.every(t=>t.includes('Hollow Key')&&t.includes('Hollow Throne')&&t.includes('Seraveth')),'final voices hand over the Key and point to the existing raid');
        check(d.name==='The Heartwood Vault'&&d.minLvl===56&&d.zone==='crownheart','Heartwood opens at 56 in Crown heart');
        check(d.enc.filter(e=>!e.boss).length===4&&d.enc.filter(e=>e.boss).length===3,'Heartwood has four packs and three bosses');
        check(d.enc.every(e=>e.lvl>=56&&e.lvl<=60&&(!e.mech||Object.keys(e.mech).every(k=>['wave','surge','enrage'].includes(k)))),'Heartwood uses existing warm-wood mechanics');
        check(d.enc.at(-1).final&&d.enc.at(-1).lvl===60&&d.enc.at(-1).hpM>=13&&d.enc.at(-1).hpM<=14&&!d.enc.some(e=>e.name.includes('Seraveth')),'Heartwood final boss is tougher than Arveth and is not Seraveth');
        check(TRACKS.crownheart.mel.split(' ').length===32&&TRACKS.crownheart.mel.split(' ').every(n=>n==='.'||ArcadeSound.hz(n)>0),'Crown heart has an original valid 32-note tune');
        for(const faction of ['concord','wild']){
          const c=rb.newHero('Heartcheck',faction,faction==='concord'?'human':'grishar','hunter');rb.S.chars.push(c);rb.S.cur=c.id;
          Object.assign(c,{lvl:49,zone:'hollowcrown',xp:0});for(const n of c.npcs)n.offset=0;rb.boot();
          const travel=()=>document.querySelector('[data-act="zone"][data-arg="crownheart"]').click();
          travel();check(c.zone==='hollowcrown','Crown heart refuses travel at 49: '+faction);
          c.lvl=50;rb.boot();travel();rb.boot();check(c.zone==='crownheart','Crown heart accepts travel at 50: '+faction);
          check(document.querySelector('#zoneLore').textContent===z.lore&&document.body.textContent.includes('Heartwatch Camp'),'inward camp and lore visible: '+faction);
          c.lvl=51;check(c.npcs.every(n=>rb.npcZone(n)==='hollowcrown'),'51 companions retain Outer Wood: '+faction);
          c.lvl=52;check(c.npcs.every(n=>rb.npcZone(n)==='crownheart'),'52 companions visit Crown heart: '+faction);
          c.zone='hollowcrown';c.quests.done.hc12=true;c.drecords={barrows:{clears:1,best:0,runs:1},rootrot:{clears:1,best:1,runs:2}};rb.boot();rb.save();
          const resumed=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1'))),old=resumed.chars.find(h=>h.id===c.id);rb.S.chars=resumed.chars;rb.S.cur=old.id;rb.boot();
          check(old.lvl===52&&old.zone==='hollowcrown'&&old.quests.done.hc12&&rb.dungeonStats('rootrot').best===1&&rb.dungeonStats('barrows').clears===1,'old level-52 save retains quests and dungeon records: '+faction);
          rb.gainXP(Math.ceil(rb.xpNeed(52)/.6),false);check(old.lvl===53,'old level-52 save resumes XP to 53: '+faction);travel();rb.boot();check(musicKey()==='crownheart','new zone selects its tune: '+faction);
          for(const q of qs){
            old.bags=[];old.grind=null;
            check(q.type!=='collect'||z.mobs.find(m=>m.id===q.mob).drop,'collection target has an item: '+q.id+' '+faction);
            if(q.req){delete old.quests.done[q.req];old.lvl=60;check(rb.qState(q)==='locked','actual prerequisite gates: '+q.id+' '+faction);old.quests.done[q.req]=true;}
            if(q.attune){
              for(const [b,r] of [[0,0],[1,0],[0,1]]){rb.dungeonStats('barrows').clears=b;rb.dungeonStats('rootrot').clears=r;old.lvl=60;check(rb.qState(q)==='locked','Hollow Key requires both clears '+b+'/'+r+': '+q.id+' '+faction);rb.accept(q.id);check(!old.quests.active.includes(q.id),'locked attunement cannot be accepted: '+q.id+' '+faction);}
              rb.dungeonStats('barrows').clears=1;rb.dungeonStats('rootrot').clears=1;
            }
            old.lvl=q.lvl-3;check(rb.qState(q)==='locked','level below minus-two locks: '+q.id+' '+faction);old.lvl=q.lvl-2;check(rb.qState(q)==='avail','level minus-two opens: '+q.id+' '+faction);
            questOffer(q.id);check(!!RTALK&&RTALK.lines[0][1]===q.text&&RTALK.choices.length===2,'voiced offer: '+q.id+' '+faction);SCN.choose(0);rb.boot();rb.spawn();check(old.quests.active.includes(q.id)&&rb.C.mob.id===q.mob,'acceptance selects actual mob: '+q.id+' '+faction);
            old.quests.prog[q.id]=q.n;
            if(q.attune){rb.dungeonStats('rootrot').clears=0;check(rb.qState(q)==='locked','imported active attunement remains gated: '+q.id+' '+faction);rb.turnIn(q.id,0,false);check(!old.quests.done[q.id],'gated attunement cannot turn in: '+q.id+' '+faction);rb.dungeonStats('rootrot').clears=1;}
            if(q.id==='ch14')check(!raidKey(old),'raid remains locked until actual ch14 turn-in: '+faction);
            rb.turnIn(q.id,0,false);const i=faction==='concord'?0:1;check(old.quests.done[q.id]&&rb.C.lines.some(l=>l.txt.includes(q.giver[i]+': "'+q.done[i]+'"')),'faction completion voice: '+q.id+' '+faction);
            questThanks(q.id);check(!!RTALK&&RTALK.lines[0][1]===q.done[i],'portrait thanks: '+q.id+' '+faction);SCN.skip();
            check(old.bags.length===1&&old.bags[0].ilvl===q.lvl+(q.elite?2:1)&&old.bags[0].rar===(q.elite?3:2),'scaled quest reward: '+q.id+' '+faction);
          }
          check(raidKey(old)&&!old.hollowKey,'ch14 alone unlocks the existing raid: '+faction);
          rb.S.tab='quests';rb.boot();check(document.body.textContent.includes("14/14 quests done in The Crown's Heart"),'chapter completion visible: '+faction);
          old.lvl=60;old.grind=elite.id;rb.boot();rb.spawn();check(rb.C.mob.rar===4&&rb.C.mob.id===elite.id,'legendary drake spawns: '+faction);rb.startTame();check(!!rb.C.taming,'legendary taming begins: '+faction);rb.finishTame();check(old.pets.some(p=>p.family==='lizard'&&p.rar===4),'legendary joins stable: '+faction);
          old.grind=null;old.lvl=55;rb.boot();document.querySelector('[data-act="tab"][data-arg="friends"]').click();check(document.querySelector('[data-act="lfg"][data-arg="heartwood"]').disabled,'Heartwood LFG locked at 55: '+faction);
          const team=old.npcs.slice(0,4).map(n=>n.id);rb.startDungeon(0,team,'heartwood');check(!old.dun,'entry rejected at 55: '+faction);
          old.lvl=56;rb.boot();document.querySelector('[data-act="tab"][data-arg="friends"]').click();check(!document.querySelector('[data-act="lfg"][data-arg="heartwood"]').disabled,'Heartwood LFG enabled at 56: '+faction);
          old.zone='hollowcrown';rb.boot();rb.startDungeon(0,team,'heartwood');check(!old.dun,'Heartwood requires Crown heart: '+faction);
          old.zone='crownheart';rb.boot();rb.startDungeon(1,team,'heartwood');check(!old.dun,'Heartwood Heroic needs normal clear: '+faction);rb.startDungeon(0,team,'heartwood');check(old.dun&&old.dun.id==='heartwood','normal entry at 56: '+faction);
          for(let i=0;i<d.enc.length;i++){old.dun.step=i;rb.spawnDungeon();check(rb.C.mob.name.includes(d.enc[i].name)&&rb.C.mob.lvl===d.enc[i].lvl&&rb.C.mob.boss===!!d.enc[i].boss,'Heartwood encounter '+i+': '+faction);}
          rb.finishDungeon();check(rb.dungeonStats('heartwood').clears===1&&rb.dungeonStats('heartwood').best===0,'Heartwood clear unlocks Heroic: '+faction);check(rb.dungeonStats('barrows').clears===1&&rb.dungeonStats('rootrot').best===1,'Heartwood clear preserves earlier records: '+faction);
          rb.startDungeon(1,team,'heartwood');check(old.dun.id==='heartwood'&&old.dun.mods.length===1,'earned Heartwood Heroic: '+faction);old.dun=null;old.lvl=59;old.xp=0;rb.boot();rb.gainXP(rb.xpNeed(59)*10,false);check(old.lvl===60&&old.xp===0,'cap at 60 discards overflow: '+faction);rb.save();
        }
      }
      // T1-A + T1-C: three talent trees, roles from your build, capstones, respec
      for(const [cls,trees] of Object.entries(rb.TALENTS)){
        check(trees.length===3,'three talent trees: '+cls);
        trees.forEach(tr=>{const cap=tr.list.filter(t=>t.req===25),ranks=tr.list.filter(t=>t.req!==25).reduce((s,t)=>s+t.max,0);
          check(ranks===25&&cap.length===1&&cap[0].max===1,'25 ranks and one capstone: '+cls+' '+tr.tree);});
        const ids=rb.TALENT_LIST[cls].map(t=>t.id);check(new Set(ids).size===ids.length,'talent ids unique: '+cls);
      }
      check(Math.max(0,60-9)<2*26,'51 points at level 60 cannot reach both capstones');
      const tw=rb.newHero('Treecheck','concord','human','warrior');tw.lvl=45;rb.S.chars.push(tw);rb.S.cur=tw.id;rb.boot();
      check(rb.talentPoints()===36,'level 45 has 36 talent points to spend');
      check(rb.heroRole()==='tank','a warrior with no talents still tanks by default');
      tw.talents={cruelty:5,wmastery:3};rb.boot();check(rb.heroRole()==='dps','an Arms warrior deals damage in groups');
      tw.talents={cruelty:2,defiance:5,shieldspec:3};rb.boot();check(rb.heroRole()==='tank','a Protection warrior tanks');
      const learn=id=>{const b=document.createElement('button');b.dataset.act='talent';b.dataset.arg=id;document.body.appendChild(b);b.click();b.remove();};
      tw.talents={};rb.boot();learn('shieldwall');check(!tw.talents.shieldwall,'a capstone needs 25 points in its tree');
      learn('defiance');check(tw.talents.defiance===1,'second-tree talents can be learned');
      tw.talents={defiance:5,shieldspec:5,anticipation:5,toughened:5,shieldslam:1,impbulwark:4};rb.boot();learn('shieldwall');check(tw.talents.shieldwall===1,'capstone learnable at 25 points in its tree');
      check(rb.bar().some(a=>a.id==='shieldwall')&&rb.bar().some(a=>a.id==='shieldslam')&&!rb.bar().some(a=>a.id==='mortal'),'the bar shows learned talent abilities only');
      for(const [cls,trees] of Object.entries(rb.TALENTS)){const n=rb.newHero('Barcheck','concord','human',cls);n.lvl=60;rb.S.chars.push(n);rb.S.cur=n.id;rb.boot();
        const most=rb.bar().length+trees.flatMap(tr=>tr.list.filter(t=>t.key==='cap'&&t.req<25)).length+1;rb.S.chars=rb.S.chars.filter(c=>c!==n);
        check(most<=9,'every learnable ability fits keys 1-9: '+cls);}
      rb.S.cur=tw.id;rb.boot();
      tw.talents={};rb.boot();const hp0=rb.ST.hpMax;tw.talents={toughened:5};rb.boot();check(rb.ST.hpMax>hp0,'Toughened raises maximum health');
      tw.money=0;tw.freeRespecUsed=false;tw.talents={cruelty:3};rb.respec();check(!Object.keys(tw.talents).length,'the first reset after the new trees is free');
      tw.talents={cruelty:3};check(rb.respecCost()===10000,'the next reset costs 1 gold');rb.respec();check(tw.talents.cruelty===3,'no reset without the gold');
      tw.money=10000;rb.respec();check(!Object.keys(tw.talents).length&&tw.money===0,'a paid reset clears talents');
      // T1-C: the third trees, each with abilities and talents that change how you play
      {const third={warrior:'Fury',rogue:'Subtlety',mage:'Arcane',priest:'Discipline',hunter:'Survival'};
        for(const [cls,name] of Object.entries(third)){const tr=rb.TALENTS[cls][2];check(tr.tree===name,'third tree: '+cls+' '+name);
          check(tr.list.filter(t=>t.key==='cap').every(t=>ABIL[cls].some(a=>a.talent===t.id)),'every learnable ability in '+name+' exists');
          check(tr.list.filter(t=>t.key!=='cap'&&t.key!=='crit'&&t.key!=='dmg'&&t.key!=='hpPct'&&t.key!=='dodge'&&t.key!=='intPct'&&t.key!=='regenPct'&&t.key!=='heal').length>=2,name+' has at least two talents that change an ability or open a window');}
        check(rb.TALENTS.priest[2].role==='heal','Discipline is a healing tree');
        const t=rb.newHero('Thirdcheck','wild','duskelf','priest');t.lvl=60;rb.S.chars.push(t);rb.S.cur=t.id;rb.boot();
        t.talents={twindisc:5,atonement:5};rb.boot();check(rb.heroRole()==='heal','a Discipline priest heals in groups');
        rb.spawn();const C=rb.C;C.mob.max=C.mob.hp=1e7;C.hp=ST.hpMax*.5;const hp0=C.hp;ABIL.priest.find(a=>a.id==='smite').fn();check(C.hp>hp0,'Atonement: Holy Smite heals you when you are hurt worst');
        t.talents={atonement:5,twindisc:5,mentalstr:5,divfury:5,dgrace:4,penance:1,painsup:1};C.buffs={};rb.boot();const raw=ST.hpMax*.2;rb.spawn();rb.C.mob.max=rb.C.mob.hp=1e7;rb.C.hp=ST.hpMax;
        const before=rb.C.hp;hitHero(raw);const plain=before-rb.C.hp;rb.C.hp=ST.hpMax;rb.C.buffs.painsup={t:8};const b2=rb.C.hp;hitHero(raw);check(b2-rb.C.hp<plain*.75,'Pain Suppression cuts the damage you take');rb.C.buffs={};
        check(ABIL.priest.find(a=>a.id==='smite').cast()<2,'Divine Fury makes Holy Smite faster');
        t.cls='warrior';t.talents={rampage:4};rb.boot();rb.spawn();rb.C.mob.hp=rb.C.mob.max*.27;check(ABIL.warrior.find(a=>a.id==='finish').cond(),'Rampage lets Finishing Blow land below 30%');
        t.talents={};rb.boot();rb.spawn();rb.C.mob.hp=rb.C.mob.max*.27;check(!ABIL.warrior.find(a=>a.id==='finish').cond(),'without Rampage Finishing Blow still waits for 20%');
        t.cls='rogue';t.talents={shadowdance:1};rb.boot();rb.spawn();rb.C.mob.max=rb.C.mob.hp=1e7;rb.C.buffs.dance={t:8};openWin('opening',8);ABIL.rogue.find(a=>a.id==='backstab').fn();
        check(rb.C.win.opening>0,'Shadow Dance keeps the Backstab opening after a Backstab');rb.C.buffs={};
        t.cls='hunter';t.talents={lockload:1};rb.boot();rb.spawn();rb.C.buffs.lnl={t:12};check(ABIL.hunter.find(a=>a.id==='shot').cast()===0,'Lock and Load makes the next Steady Shot instant');
        rb.C.mob.max=rb.C.mob.hp=1e7;ABIL.hunter.find(a=>a.id==='shot').fn();check(!rb.C.buffs.lnl,'and is used up by that shot');
        t.cls='mage';t.talents={};rb.boot();rb.spawn();rb.C.mob.max=rb.C.mob.hp=1e7;const m0=dmgMods();rb.C.buffs.arcpower={t:15};check(dmgMods()>m0*1.3,'Arcane Power raises your damage');rb.C.buffs={};
        t.cls='priest';t.lvl=45;t.talents={twindisc:3};t.freeRespecUsed=true;delete t.freeTreesV;t.money=0;rb.boot();check(rb.respecCost()===0,'everyone gets one more free reset for the third trees');
        rb.respec();check(!Object.keys(t.talents).length&&t.freeTreesV===3,'that reset is used once');t.talents={twindisc:1};check(rb.respecCost()===10000,'later resets cost gold again');
        rb.S.chars=rb.S.chars.filter(c=>c!==t);rb.S.cur=tw.id;rb.boot();}
      tw.talents={cruelty:1};check(rb.respecCost()===20000,'resets in a row cost more');
      tw.lvl=30;tw.talents={cruelty:2};check(rb.respecCost()===0,'resets are free below level 40');
      rb.S.chars=rb.S.chars.filter(c=>c!==tw);
      // T1-B: Grave Chill in the Silent Barrows
      {const g=rb.newHero('Chillcheck','concord','human','priest');g.lvl=45;g.zone='barrowfield';g.talents={circle:1};rb.S.chars.push(g);rb.S.cur=g.id;rb.boot();
        g.party=g.npcs.slice(0,4).map(n=>n.id);syncParty();const C=rb.C,boss={name:'Test Wayward',hp:1e6,max:1e6,dmg:1,lvl:45,dots:{},armor:0,mech:{chill:5}};C.mob=boss;
        C.chill=0;for(const p of C.party){p.chill=0;p.hp=compStats(p.n).hpMax;}C.hp=rb.ST.hpMax;C.chillT=.05;C.chillTick=0;graveChill(boss,.1);
        check(C.chill===1&&partyAlive().every(p=>p.chill===1),'Grave Chill lays a stack on you and every companion');
        const hp0=C.hp;C.chillTick=.95;graveChill(boss,.1);check(C.hp<hp0,'Grave Chill hurts every second');
        const before=C.chill+partyAlive().reduce((s,p)=>s+p.chill,0);C.hp=1;healLowest(10,'Test');
        check(C.chill+partyAlive().reduce((s,p)=>s+p.chill,0)===before-1,'a heal takes one Grave Chill stack off');
        C.hp=rb.ST.hpMax;for(let i=0;i<10;i++){C.chillT=0;graveChill(boss,.001);}check(C.chill===5&&partyAlive().every(p=>p.chill===5),'Grave Chill stacks up to five');
        ABIL.priest.find(a=>a.id==='circle').fn();check(C.chill===0&&partyAlive().every(p=>!p.chill),'Circle of Light clears every stack');
        C.mob=null;rb.S.chars=rb.S.chars.filter(c=>c!==g);}
      // D2+D3: group kill XP is shared with classic bonuses; journey length scales all XP
      {const p=rb.newHero('Pacecheck','concord','human','warrior');p.lvl=30;p.xp=0;rb.S.chars.push(p);rb.S.cur=p.id;rb.boot();const C=rb.C;
        const share=n=>{p.party=p.npcs.slice(0,n).map(x=>x.id);syncParty();return groupXP(1000);};
        check(share(0)===1000,'a solo hero keeps all kill XP');check(share(1)===500,'a pair splits kill XP evenly');
        check(share(2)===389&&share(3)===325&&share(4)===280,'groups of 3, 4 and 5 share kill XP with the classic bonuses');
        p.party=[];syncParty();const xp0=p.xp;rb.gainXP(1000,false);check(p.xp-xp0===1000,'Classic journey gives XP as is');
        p.pace='breezy';const xp1=p.xp;rb.gainXP(1000,false);check(p.xp-xp1===1600,'Breezy gives 60% more XP');
        p.pace='long';const xp2=p.xp;rb.gainXP(1000,false);check(p.xp-xp2===600,'Long Road gives 40% less XP');
        const b=document.createElement('button');b.dataset.act='pace';b.dataset.arg='breezy';document.body.appendChild(b);b.click();b.remove();
        check(p.pace==='breezy','the Journal can change the journey length');
        rb.S.chars=rb.S.chars.filter(c=>c!==p);}
      // S1: quest givers speak in shared portrait scenes when you accept or turn in by hand
      {const s=rb.newHero('Scenecheck','wild','grishar','hunter');s.lvl=40;s.zone='barrowfield';rb.S.chars.push(s);rb.S.cur=s.id;rb.boot();
        const q=rb.QUESTS.barrowfield[0];questOffer(q.id);check(!!RTALK&&RTALK.lines[0][0]===giver(q)&&RTALK.choices.length===2,'Accept opens the giver\'s scene with two choices');
        SCN.choose(1);check(!RTALK&&!s.quests.active.includes(q.id),'"Not now" leaves the quest unaccepted');
        questOffer(q.id);SCN.choose(0);check(s.quests.active.includes(q.id),'"Accept" takes the quest');
        s.quests.prog[q.id]=q.n;rb.turnIn(q.id,0,false);questThanks(q.id);check(!!RTALK&&RTALK.lines[0][1]===q.done[1],'turning in plays the giver\'s thanks in their voice');
        SCN.skip();check(!RTALK,'a scene can be skipped');
        const a=giverLook('Pathkeeper Dorr'),b=giverLook('Pathkeeper Dorr');check(JSON.stringify(a)===JSON.stringify(b)&&a.tusks,'a giver always gets the same face, from their faction\'s peoples');
        rb.S.chars=rb.S.chars.filter(c=>c!==s);}
      // S2: the shared chiptune engine plays Realmbound's own music per zone, off by default
      {check(Object.keys(rb.ZONES).every(z=>SND.tracks[z]&&SND.tracks[z].mel.length)&&['dungeon','boss','ghost'].every(k=>SND.tracks[k]),'every zone, dungeons, bosses and the spirit walk have their own tune');
        check(Object.values(SND.tracks).every(t=>t.mel.concat(t.bass).every(n=>n==='.'||SND.hz(n)>0)),'every note in every tune is a real pitch');
        const g=rb.newHero('Soundcheck','concord','human','priest');g.zone='fens';rb.S.chars.push(g);rb.S.cur=g.id;rb.boot();const C=rb.C;
        check(musicKey()==='fens','out in the world the zone\'s tune plays');C.phase='dead';check(musicKey()==='ghost','after a death the spirit tune plays');C.phase='fight';
        g.dun={id:'x'};C.mob={boss:false};check(musicKey()==='dungeon','in a dungeon the dungeon tune plays');C.mob={boss:true};check(musicKey()==='boss','a boss gets its own tune');g.dun=null;C.mob=null;
        const was=rb.S.snd;delete rb.S.snd;SND.render();const btn=document.querySelector('#sndBtn');
        check(!!btn&&btn.textContent==='Sound: off','sound starts off, shown in the header');
        btn.click();check(rb.S.snd===1&&btn.textContent==='Sound: effects','the header button turns on effects');
        btn.click();check(rb.S.snd===2&&btn.textContent==='Sound: effects + music','and then music');
        let ok=true;try{for(const n of ['level','quest','lose','warn','dodge','loot','catch','win','blip'])sfx(n,n==='blip'?voiceOf('Pathkeeper Dorr'):undefined);}catch(e){ok=false;}
        check(ok,'every Realmbound sound effect plays without error');
        btn.click();check(rb.S.snd===0,'a third press turns sound off again');
        check(voiceOf('Pathkeeper Dorr')===voiceOf('Pathkeeper Dorr:happy')&&voiceOf('Pathkeeper Dorr')>=260&&voiceOf('Pathkeeper Dorr')<540,'each giver keeps one voice pitch whatever their mood');
        if(was===undefined)delete rb.S.snd;else rb.S.snd=was;rb.S.chars=rb.S.chars.filter(c=>c!==g);}
      // S3 + R1: the shared roster pays by the clock, and other heroes mine ore for the account's supply bank
      {const mk=(o)=>{const st={},got={n:0};return {st,got,R:Roster.create(Object.assign({get:()=>st,jobs:{dig:{every:()=>60,give:(w,n)=>{got.n+=n;}}},slots:()=>2},o||{}))};};
        const t0=1e12,H1=3600e3;
        const a=mk();a.R.assign('x','dig',t0);for(let t=t0;t<=t0+H1;t+=10e3)a.R.collect(t);
        const b=mk();b.R.assign('x','dig',t0);b.R.collect(t0+H1);
        check(a.got.n===60&&b.got.n===60,'an hour of work pays the same whether collected every few seconds or once on return');
        const c=mk();c.R.assign('x','dig',t0);c.R.collect(t0+20*H1);check(c.got.n===480,'time away is capped at 8 hours, like rested XP');
        c.R.collect(t0+20*H1+30e3);check(c.got.n===480,'after the cap the clock restarts from the return, not from the start');
        const d=mk();d.R.assign('x','dig',t0);d.R.collect(t0+90e3);const saved=JSON.parse(JSON.stringify(d.st));
        const d2=mk();Object.assign(d2.st,saved);d2.R.collect(t0+120e3);check(d.got.n===1&&d2.got.n===1,'a save made partway through a unit keeps the part-finished work after reloading');
        d2.R.collect(t0+120e3);check(d2.got.n===1,'collecting twice never pays twice');
        const e=mk({canWork:w=>w!=='me'});check(!e.R.assign('me','dig',t0),'the member being played can\'t take a job');
        e.R.assign('x','dig',t0);e.R.assign('y','dig',t0);check(!e.R.assign('z','dig',t0)&&e.R.free()===0,'jobs are limited to the open slots');
        check(e.R.stop('x',t0+150e3)===2&&!e.R.jobOf('x'),'stopping a job pays what was earned first');}
      {const A=rb.newHero('Supplya','concord','human','warrior');A.lvl=40;const B=rb.newHero('Supplyb','concord','stonekin','priest');B.lvl=20;
        const keep={bank:rb.S.bank,guild:rb.S.guild};rb.S.bank={ore:0,kit:0};rb.S.guild={jobs:{}};
        rb.S.chars.push(A,B);rb.S.cur=A.id;rb.boot();const bBags=JSON.stringify(B.bags);
        check(!ROSTER.assign(A.id,'mine')&&ROSTER.assign(B.id,'mine'),'only the heroes you aren\'t playing can mine');
        rb.S.guild.jobs[B.id].since-=3600e3;supplyTick();const per=JOBS.mine.every(B.id);
        check(rb.S.bank.ore===Math.floor(3600/per)&&per===400,'a level-20 miner sends about 9 ore an hour to the shared bank');
        rb.S.tab='supplies';renderTab(true);check(/Jobs board/.test(document.querySelector('#tabbody').innerHTML)&&/Supplyb/.test(document.querySelector('#tabbody').innerHTML),'the Supplies tab shows the bank and the jobs board');
        rb.S.bank.ore=7;check(craftKit()&&rb.S.bank.ore===1&&rb.S.bank.kit===1,'six ore make a repair kit');
        A.gear.weapon.dur=20;rb.C.run=100;rb.C.lastInput=100;A.mode='auto';afterFight();
        check(A.gear.weapon.dur===100&&rb.S.bank.kit===0&&rb.C.phase!=='town','Auto mends worn gear with a kit instead of walking to town');
        A.gear.weapon.dur=20;afterFight();check(rb.C.phase==='town','with no kits left Auto walks back to town as before');A.mode='focus';
        rb.S.guild.jobs[B.id].since-=1800e3;switchTo(B.id);
        check(!ROSTER.jobOf(B.id)&&rb.S.bank.ore===1+Math.floor(1800/per),'switching to a miner pays their work and takes them off the job');
        check(JSON.stringify(B.bags)===bBags,'heroes keep their own bags; nothing moves between characters');
        const old=rb.migrate({v:2,chars:[JSON.parse(JSON.stringify(A))],cur:A.id,last:Date.now(),tab:'quests'});check(!old.bank&&!old.guild,'saves from before supplies load unchanged');
        // more jobs: herbs and potions, questing for the worker's own XP
        const W=rb.newHero('Supplyw','concord','human','mage');W.lvl=30;rb.S.chars.push(W);rb.S.cur=A.id;rb.boot();
        check(ROSTER.assign(W.id,'herb')&&ROSTER.busy()===1,'a hero can gather herbs');rb.S.guild.jobs[String(W.id)].since-=3600e3;supplyTick();
        check(rb.S.bank.herb===Math.floor(3600/JOBS.herb.every(W.id)),'herbs arrive in the shared bank');
        rb.S.bank.herb=8;check(craftPotion()&&craftPotion()&&rb.S.bank.potion===2&&rb.S.bank.herb===0,'four herbs brew a healing potion');
        rb.spawn();rb.C.mob.max=rb.C.mob.hp=1e7;rb.C.hp=ST.hpMax*.25;rb.step(.1);check(rb.S.bank.potion===1&&rb.C.hp>ST.hpMax*.5,'below 30% health in a fight you drink a potion');
        rb.C.hp=ST.hpMax*.25;rb.step(.1);check(rb.S.bank.potion===1,'only one potion a minute');
        rb.C.cds.potion=0;rb.S.bank.autoPot=false;rb.C.hp=ST.hpMax*.25;rb.step(.1);check(rb.S.bank.potion===1,'potion drinking can be switched off');rb.S.bank.autoPot=true;rb.C.hp=ST.hpMax;rb.C.mob=null;rb.C.phase='seek';
        ROSTER.stop(W.id);const lv0=W.lvl,xp0=W.xp,need=rb.xpNeed(W.lvl);ROSTER.assign(W.id,'quest');rb.S.guild.jobs[String(W.id)].since-=3600e3;supplyTick();
        check(W.lvl===lv0&&W.xp-xp0===3*Math.round(need*.02)&&W.money>0,'an hour of questing gives the worker about 6% of a level and some coin');
        check((W.xp-xp0)/need<.1,'questing stays far slower than playing the hero');
        W.xp=rb.xpNeed(W.lvl)-1;rb.S.guild.jobs[String(W.id)].since-=1200e3;supplyTick();check(W.lvl===lv0+1,'questing workers can level up');
        rb.S.chars=rb.S.chars.filter(c=>c!==W);
        rb.S.cur=A.id;rb.boot();deleteChar(B.id);check(!rb.S.guild.jobs[B.id],'deleting a character takes them off the jobs board');
        rb.S.chars=rb.S.chars.filter(c=>c!==A&&c!==B);rb.S.bank=keep.bank;rb.S.guild=keep.guild;if(!keep.bank)delete rb.S.bank;if(!keep.guild)delete rb.S.guild;rb.S.tab='quests';}
      // R2: raids. The Hollow Throne: plans, raid calls, lockout, set loot (raid levels follow the level cap)
      {const th=RAIDS.throne,bosses=th.enc.filter(e=>e.boss);
        check(bosses.length===4&&bosses.every(e=>e.mech&&e.mech.raid&&e.plans.length>=2&&e.tell),'four raid bosses, each with a tell and plans');
        check(bosses.flatMap(e=>e.slots).sort().join()==='chest,feet,hands,head,legs','the bosses drop a full five-piece set between them');
        check(!rb.DUNGEONS.throne&&dungeonDef('throne')===th,'the raid is not listed among the 5-person dungeons');
        const R0=rb.newHero('Raidcheck','concord','human','warrior');R0.lvl=LEVEL_CAP;rb.S.chars.push(R0);rb.S.cur=R0.id;rb.boot();
        for(const n of R0.npcs){n.met=true;n.aff=AFFINITY[2].at;n.offset=Math.max(n.offset,-1);}
        check(/Hollow Key/.test(raidProblem(autoRaid()))&&!startRaid(),'the raid is sealed without the Hollow Key');R0.hollowKey=true;
        const few=R0.npcs.slice(0,5).map(n=>n.id);check(/nine/.test(raidProblem(few)),'a raid needs nine others');
        const healers=R0.npcs.filter(n=>ROLE_OF[n.cls]==='heal').map(n=>n.id),noheal=autoRaid().filter(id=>!healers.includes(id));
        const pool=R0.npcs.filter(n=>!healers.includes(n.id)&&!noheal.includes(n.id)).map(n=>n.id);const nh=noheal.concat(pool).slice(0,9);
        if(nh.length===9)check(/two healers/.test(raidProblem(nh)),'a raid needs two healers');
        const alt=rb.newHero('Altraider','concord','stonekin','priest');alt.lvl=LEVEL_CAP;rb.S.chars.push(alt);
        check(autoRaid().includes('alt'+alt.id)&&npcOf('alt'+alt.id).name==='Altraider','your other characters can join the raid');
        const prev=R0.party.slice();check(startRaid()&&R0.dun.raid&&R0.party.length===9&&rb.C.party.length===9,'Gather the raid starts a ten-person run');
        R0.mode='focus';R0.dun.step=1;rb.C.lastInput=rb.C.run;rb.C.t=0;rb.step(.1);check(rb.C.phase==='plan'&&modalKind==='raidplan','before a boss the raid stops for a plan');
        choosePlan(1);check(R0.dun.plans[1]===1&&rb.C.phase==='seek','choosing a plan sends the raid in');
        rb.C.t=0;rb.C.lastInput=rb.C.run;rb.step(.1);const boss=rb.C.mob;check(boss&&boss.boss&&boss.raidStep===1&&rb.C.plan.swapAt===5,'the boss fight uses the chosen plan');
        boss.max=boss.hp=1e9;rb.C.shred=4;rb.C.shredT=.05;rb.C.lastInput=rb.C.run;rb.step(.1);check(rb.C.tell&&rb.C.tell.kind==='swap','enough shred stacks call for a tank swap');
        raidCall('swap');rb.C.tell.t=0;rb.C.lastInput=rb.C.run;rb.step(.1);check(rb.C.shred===0&&!rb.C.tell,'calling Swap in time resets the stacks');
        const hp1=rb.C.hp;rb.C.tell={kind:'stack',t:0,called:null};rb.C.lastInput=rb.C.run;rb.step(.1);check(rb.C.hp<hp1-ST.hpMax*.2,'a missed Choir call hurts everyone');
        rb.C.hp=ST.hpMax;const hp2=rb.C.hp;rb.C.tell={kind:'spread',t:1,called:null};check(raidKeyPress('q')&&rb.C.tell.called==='spread','Q calls Spread');rb.C.tell.t=0;rb.C.lastInput=rb.C.run;rb.step(.1);check(rb.C.hp>hp2-ST.hpMax*.2,'the right call avoids it');
        check(autoCallChance()<.6,'without Raid Leader, Auto calls poorly');R0.dun.wipes=5;check(autoCallChance()>.6,'each wipe teaches the raid the fight');R0.dun.wipes=0;
        boss.hp=1;boss.lootN=2;rb.C.lastInput=rb.C.run;const items=raidLoot(boss);check(items.some(it=>it.set==='warrior'&&it.rar===4&&it.slot==='hands'&&/^Thornwarden/.test(it.name)),'bosses drop your class set');
        check(raidLock().killed.includes(1),'a killed boss is locked out');
        const hpA=(R0.gear.hands=items.find(i=>i.set),rb.boot(),ST.hpMax);R0.gear.feet=Object.assign(genItem(LEVEL_CAP+4,4,'feet',{cls:'warrior'}),{set:'warrior'});rb.boot();
        check(setPieces()===2&&ST.hpMax>hpA,'two set pieces give the two-piece bonus');
        leaveDungeon();check(!R0.dun&&R0.party.join()===prev.join(),'leaving the raid restores your old party');
        startRaid();R0.dun.step=1;rb.C.t=0;rb.C.lastInput=rb.C.run;rb.step(.1);check(R0.dun.step===2&&rb.C.mob&&rb.C.mob.raidStep===2,'bosses killed this lockout stay dead');leaveDungeon();
        R0.raidLock.at=Date.now()-4*864e5;check(raidLock().killed.length===0,'the lockout resets after 3 days');
        R0.dun={id:'throne',tier:0,step:6,mods:[],wipes:0,raid:true,plans:{},prev:[]};syncParty();raidFinish();check(R0.raidLeader&&dungeonStats('throne').clears===1&&!R0.dun,'a clear earns Raid Leader');
        rb.S.chars=rb.S.chars.filter(c=>c!==R0&&c!==alt);if(modalKind)closeModal();rb.S.cur=rb.S.chars.length?rb.S.chars[0].id:null;}
      // S5: living scenes. Every zone and dungeon has a backdrop, and drawing every one of them never fails
      {check(Object.keys(rb.ZONES).every(z=>AMB_ZONES[z]&&AMB_ZONES[z].far&&AMB_ZONES[z].weather.every(w=>AMB_WEATHER[w])),'every zone has its own scenery and weather');
        check(Object.keys(rb.DUNGEONS).every(d=>AMB_DUNGEONS[d])&&AMB_DUNGEONS.throne,'every dungeon and the raid has its own air');
        const ns=[0,.3,.62,.7,.8,.95].map(k=>realmNight(k*AMB_DAY*1000));check(ns[0]===0&&ns[3]>0&&ns[4]===1&&ns.every(n=>n>=0&&n<=1),'a 24-minute day: day, dusk, night, dawn');
        const v=rb.newHero('Scenecheck2','wild','duskelf','mage');v.lvl=40;rb.S.chars.push(v);rb.S.cur=v.id;rb.boot();let ok=true,err='';
        const keepW=window.zoneWeather,keepN=window.realmNight;let tt=1000;const drawAmb=()=>{tt+=.05;const gy=(PH||200)*.78,p=4,A=ambBack(tt,gy,p);if(rb.C.phase==='intown')ambTown(gy,tt,A);ambFront(tt,gy,p,A);};
        try{for(const z of Object.keys(rb.ZONES))for(const w of Object.keys(AMB_WEATHER))for(const n of [0,1]){v.zone=z;zoneWeather=()=>w;realmNight=()=>n;for(const ph of ['seek','rest','intown']){rb.C.phase=ph;drawAmb();}}
          for(const d of Object.keys(AMB_DUNGEONS)){v.dun={id:d,tier:0,step:0,mods:[],wipes:0,raid:d==='throne',plans:{}};drawAmb();}}catch(e){ok=false;err=String(e);}
        zoneWeather=keepW;realmNight=keepN;v.dun=null;check(ok,'every zone, weather, time of day and dungeon draws without error'+(err?': '+err:''));
        rb.S.chars=rb.S.chars.filter(c=>c!==v);}
      // Guild: founding, members and mood, guild levels, adventurers on the jobs board
      {const keepG=rb.S.guild,keepB=rb.S.bank;rb.S.guild={jobs:{}};rb.S.bank={};
        const A=rb.newHero('Guildlead','concord','human','warrior');A.lvl=45;const B1=rb.newHero('Guildalt','concord','stonekin','priest');B1.lvl=30;const B2=rb.newHero('Guildalt2','concord','human','mage');B2.lvl=20;
        const keepC=rb.S.chars,keepCur=rb.S.cur;rb.S.chars=[A,B1,B2];rb.S.cur=A.id;rb.boot();
        check(guildXPMult()===1&&jobSlots()===3&&/Found a guild/.test(guildHTML()),'without a guild: no bonus, three job slots, an offer to found one');
        A.lvl=35;check(/level 40/.test(foundProblem()),'a charter needs a level 40 hero');A.lvl=45;rb.C.phase='seek';check(/in town/.test(foundProblem()),'the charter is bought in town');
        rb.C.phase='intown';A.money=0;check(/costs/.test(foundProblem()),'the charter costs gold');A.money=60000;
        check(/signatures/.test(foundProblem()),'a charter needs five signatures');
        const fr=A.npcs.slice(0,3);for(const n of fr){n.met=true;n.aff=AFFINITY[2].at;}
        check(foundProblem()===''&&foundGuild('The Testers')&&guildOn()&&A.money===10000&&rb.S.guild.name==='The Testers'&&rb.S.guild.level===1,'founding the guild takes the charter fee');
        check(Object.keys(rb.S.guild.members).length===3&&fr.every(n=>isMember(n,A)),'friends who signed join as members');
        const x0=A.xp;rb.gainXP(1000,false);check(A.xp-x0===1020,'guild level 1 gives every character 2% more experience');
        guildXP(600);check(rb.S.guild.level===2&&jobSlots()===4,'guild experience raises the guild level and adds a job slot');
        guildXP(1e6);check(rb.S.guild.level===5&&jobSlots()===6&&guildXPMult()===1.1,'guild level 5: +10% experience and six job slots');
        const k=memberKey(A.id,fr[0].id);check(workerOf(k).name===fr[0].name&&workers().includes(k),'guild adventurers can work the jobs board');
        A.party=[fr[0].id];syncParty();check(!workerCanWork(k),'but not while they travel with you');A.party=[];syncParty();
        check(jobsFor(k).includes('guard')&&!jobsFor(k).includes('quest')&&jobsFor(String(B1.id)).includes('quest'),'adventurers mine, gather and guard; your characters can also quest');
        check(ROSTER.assign(k,'mine'),'an adventurer takes a job');rb.S.guild.jobs[k].since-=3600e3;const ore0=rb.S.bank.ore;supplyTick();check(rb.S.bank.ore>ore0,'their ore reaches the shared bank');
        const k2=memberKey(A.id,fr[1].id);ROSTER.assign(k2,'guard');const gx=rb.S.guild.xp;rb.S.guild.jobs[k2].since-=3600e3;supplyTick();check(rb.S.guild.xp>gx,'guard duty earns guild experience');
        const k3=memberKey(A.id,fr[2].id),m3=rb.S.guild.members[k3];m3.mood=60;m3.at-=30*36e5;guildTick();check(Math.round(m3.mood)===36,'a benched adventurer loses mood, at most a day\'s worth while you are away');
        m3.mood=25;m3.at-=36e5;guildTick();check(m3.warned,'a low mood brings a warning');
        m3.mood=9.5;m3.at-=36e5;guildTick();check(!rb.S.guild.members[k3],'ignored too long, they leave the guild');
        const m1=rb.S.guild.members[k];m1.mood=50;m1.at-=36e5;guildTick();check(m1.mood>50,'working a job keeps a member content');
        check(inviteToGuild(fr[2].id)&&isMember(fr[2],A),'friends can be invited (back) to the guild');check(dismissMember(k3)&&!isMember(fr[2],A),'and dismissed');
        moodBump(fr[0],10);check(rb.S.guild.members[k].mood>=60,'loot and shared clears lift a member\'s mood');
        const g0=rb.S.guild.xp,q=rb.QUESTS.thornvale[0];A.quests.active.push(q.id);A.quests.prog[q.id]=q.n;rb.turnIn(q.id,0,false);check(rb.S.guild.xp===g0+10,'turning in a quest earns guild experience');
        rb.S.tab='supplies';renderTab(true);check(/The Testers/.test(document.querySelector('#tabbody').innerHTML)&&/Jobs board/.test(document.querySelector('#tabbody').innerHTML),'the Guild tab shows the guild hall and the jobs board');
        const old=rb.migrate({v:2,chars:[JSON.parse(JSON.stringify(B2))],cur:B2.id,last:Date.now(),tab:'quests'});check(!old.guild,'saves from before the guild load unchanged');
        rb.S.chars=keepC;rb.S.cur=keepCur;rb.S.guild=keepG;rb.S.bank=keepB;if(!keepG)delete rb.S.guild;if(!keepB)delete rb.S.bank;rb.S.tab='quests';if(H())rb.boot();}
      // Account-wide guild raid rosters: owned companions, job reservations and persistent memories.
      {const keepC=rb.S.chars,keepCur=rb.S.cur,keepG=rb.S.guild,keepB=rb.S.bank;
        const lead=rb.newHero('Guildraider','concord','human','mage'),owner=rb.newHero('Guildhost','concord','stonekin','warrior');
        lead.lvl=owner.lvl=LEVEL_CAP;lead.hollowKey=true;rb.S.chars=[lead,owner];rb.S.cur=lead.id;rb.S.guild={jobs:{}};rb.S.bank={};rb.boot();
        const ns=owner.npcs.slice(0,8),classes=['warrior','priest','priest','priest','mage','rogue','hunter','mage'];
        ns.forEach((n,i)=>{n.cls=classes[i];n.met=true;n.aff=AFFINITY[2].at;n.offset=0;});ns[0].id=lead.npcs[0].id;
        check(raidCandidates().length===1&&!raidGuild(memberKey(owner.id,ns[0].id)),'without a founded guild, other heroes\' companions stay unavailable');
        Object.assign(rb.S.guild,{name:'The Shared Lantern',founded:Date.now(),level:1,xp:0,members:{}});ns.forEach(n=>addMember(n,owner,true));
        const keys=ns.map(n=>memberKey(owner.id,n.id)),first=keys[0],alt='alt'+owner.id,ids=autoRaid();
        check(ids.length===9&&keys.every(k=>ids.includes(k))&&ids.includes(alt)&&raidProblem(ids)==='','a guild gathers nine others across heroes, with two tanks and three healers');
        check(npcOf(first).id===first&&npcOf(first).name===ns[0].name&&npcOf(ns[0].id)===lead.npcs[0],'owner-qualified ids resolve the right companion even when local ids collide');
        ns[0].offset=-2;check(npcLvl(npcOf(first))===LEVEL_CAP-2&&compStats(npcOf(first)).lvl===LEVEL_CAP-2,'guild companions keep their owner\'s level and offset in combat');
        ns[0].offset=-3;check(!raidCandidates().some(n=>n.id===first)&&/available/.test(raidProblem(ids)),'a low-level member cannot bypass eligibility with a direct raid call');ns[0].offset=0;
        ns[0].met=false;check(!raidCandidates().some(n=>n.id===first),'an unmet companion cannot join');ns[0].met=true;
        ns[0].aff=0;check(!raidCandidates().some(n=>n.id===first),'a stranger cannot join');ns[0].aff=AFFINITY[2].at;
        owner.dun={id:'rootrot'};check(raidCandidates().length===0,'a hero in a dungeon and their companions stay with that expedition');owner.dun=null;
        const m=rb.S.guild.members[first];delete rb.S.guild.members[first];check(!npcOf(first)&&!raidCandidates().some(n=>n.id===first),'a dismissed guild adventurer is not a raider');rb.S.guild.members[first]=m;
        const key0=TABS.friends.key();delete rb.S.guild.members[first];check(TABS.friends.key()!==key0,'the Friends tab refreshes when the guild raid pool changes');rb.S.guild.members[first]=m;
        check(ROSTER.assign(first,'mine')&&ROSTER.assign(owner.id,'mine'),'future raiders can work before gathering');
        rb.S.guild.jobs[first].since-=3600e3;rb.S.guild.jobs[String(owner.id)].since-=3600e3;const due=Math.floor(3600/JOBS.mine.every(first))+Math.floor(3600/JOBS.mine.every(owner.id));
        check(!startRaid(ids.slice(1))&&ROSTER.jobOf(first)==='mine'&&bank().ore===0,'a rejected raid leaves jobs and earnings untouched');
        lead.party=[lead.npcs[0].id];syncParty();const oldParty=lead.party.slice();
        check(startRaid(ids)&&rb.C.party.length===9&&rb.C.party.some(p=>p.id===first),'guild raiders enter through the existing ten-person combat engine');
        updateWorld();check(rb.C.party.every(p=>document.getElementById('pm-'+p.id)&&document.getElementById('pmt-'+p.id).textContent.includes('/')),'all owner-qualified raiders have working health frames');
        rb.spawnDungeon();const mobHP=rb.C.mob.hp;for(let i=0;i<20;i++){rb.C.lastInput=rb.C.run;rb.step(.1);}check(rb.C.mob&&rb.C.mob.hp<mobHP&&rb.C.party.length===9,'the shared roster fights through real raid combat steps');
        check(!ROSTER.jobOf(first)&&!ROSTER.jobOf(owner.id)&&bank().ore===due,'gathering settles earned work once and stops the selected jobs');const ore=bank().ore;supplyTick();check(bank().ore===ore,'stopped raid jobs never pay twice');
        check(!ROSTER.assign(first,'mine')&&!ROSTER.assign(owner.id,'mine')&&!dismissMember(first),'active raiders cannot also work or leave the guild');
        const savedMood=m.mood;m.mood=1;m.at=Date.now()-1000;guildTick();check(rb.S.guild.members[first]===m&&!lead.log.some(t=>t.includes(ns[0].name+' left ')),'an unhappy attending member stays through the raid without false departure messages');m.mood=savedMood;
        const before=ns[0].aff,mood=m.mood;addAff(npcOf(first),2,'Held the line with another guild hero.');moodBump(npcOf(first),6);
        check(ns[0].aff===before+2&&ns[0].notes[0]==='Held the line with another guild hero.'&&m.mood===mood+6,'raid friendship, memories and mood reach the original companion');
        m.at-=3600e3;const happy=m.mood;guildTick();check(m.mood>happy,'time in a guild raid raises the attending member\'s mood');
        rb.S.cur=owner.id;rb.boot();check(!workerCanWork(first)&&!workerCanWork(owner.id)&&!workerCanWork(lead.id)&&!dismissMember(first),'switching heroes leaves the saved raid\'s members reserved');rb.S.cur=lead.id;rb.boot();
        rb.save();const restored=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1')));Object.assign(rb.S,restored);rb.boot();
        const loadedOwner=charOf(owner.id),loadedLead=H(),loadedNpc=loadedOwner.npcs.find(n=>n.id===ns[0].id);
        check(loadedLead.party.includes(first)&&rb.C.party.length===9&&npcOf(first).name===loadedNpc.name&&loadedNpc.aff===before+2,'a saved raid reloads all nine raiders and their persistent friendship');
        check(!Object.prototype.hasOwnProperty.call(loadedNpc,'guildKey')&&loadedNpc.id===ns[0].id&&loadedNpc.offset===0,'runtime raid views add no proxy fields to the saved companion');
        const aff=loadedNpc.aff;loadedLead.dun.step=6;raidFinish();
        check(!loadedLead.dun&&loadedLead.party.join()===oldParty.join()&&loadedNpc.aff===aff+15&&loadedNpc.notes.some(n=>/Cleared The Hollow Throne/.test(n)),'finishing the raid remembers it on the owning hero and restores the leader\'s party');
        check(workerCanWork(first)&&workerCanWork(owner.id)&&!ROSTER.jobOf(first),'raiders are free afterward; jobs stay stopped until assigned again');
        check(/guild adventurers/.test(raidSection())&&/jobs stay stopped/.test(raidSection()),'the raid page explains the shared roster and job handoff');
        rb.S.chars=keepC;rb.S.cur=keepCur;rb.S.guild=keepG;rb.S.bank=keepB;if(!keepG)delete rb.S.guild;if(!keepB)delete rb.S.bank;rb.S.tab='quests';if(H())rb.boot();}
      // S4: the shared world kit, and walkable Realmbound towns
      {const m=TOWN.map;check(m.rows.length===16&&m.rows.every(r=>r.length===28),'the town map is 28 by 16');
        const tw=rb.newHero('Towncheck','concord','human','warrior');tw.lvl=20;tw.mode='focus';const keepC=rb.S.chars,keepCur=rb.S.cur;rb.S.chars=[tw];rb.S.cur=tw.id;rb.boot();rb.C.phase='intown';rb.C.lastInput=rb.C.run;
        if(modalKind)closeModal();townEnter();check(TOWN.pos.x===13&&TOWN.pos.y===14&&!TOWN.auto,'you arrive at the town gate');
        check(TOWN_BUILDINGS.every(b=>{TOWN_WALK.place(13,14,'up');return TOWN_WALK.walkTo(b.door,b.y+b.h-1);}),'every building door can be reached from the gate');
        TOWN_WALK.place(13,14,'up');check(TOWN_WALK.step('up')&&TOWN.pos.y===13,'walking moves you a tile');TOWN_WALK.place(1,1,'up');check(!TOWN_WALK.step('up')&&TOWN.pos.y===1,'trees block the way');
        rb.C.hp=1;townDoor(TOWN_BUILDINGS.find(b=>b.kind==='inn'));check(rb.C.hp===rb.ST.hpMax,'the inn heals you');
        tw.bags.push(genJunk(20,'beast'));tw.gear.weapon.dur=10;const m0=tw.money;townDoor(TOWN_BUILDINGS.find(b=>b.kind==='smith'));check(!tw.bags.some(i=>i.junk)&&tw.gear.weapon.dur===100&&tw.money!==m0,'the smithy buys junk and repairs');
        townDoor(TOWN_BUILDINGS.find(b=>b.kind==='guild'));check(rb.S.tab==='supplies','the guild hall door opens the Guild tab');
        const questWidth=PW;PW=1000;while(RTALK)SCN.skip();const g=townPeople().find(n=>n.id==='giver');townTalk(g);check(!!RTALK&&RTALK.choices&&RTALK.choices.some(s=>s.includes('Hear the request')),'the quest giver offers available requests in a scene');SCN.choose(RTALK.choices.length-1);
        const keepP=window.pellHere;pellHere=()=>true;const pell=townPeople().find(n=>n.id==='pell');check(!!pell,'Pell visits the town now and then');
        tw.money=1000;const pots=bank().potion;while(RTALK)SCN.skip();townTalk(pell);SCN.choose(0);check(bank().potion===pots+1&&tw.money===800,'Pell sells a healing potion for 2 silver');pellHere=keepP;PW=questWidth;
        TOWN_WALK.place(13,14,'down');TOWN_WALK.step('down');check(rb.C.phase==='seek','the town gate takes you back on the road');
        tw.mode='auto';rb.C.phase='intown';townEnter();tw.bags.push(genJunk(20,'beast'));for(let i=0;i<2000&&rb.C.phase==='intown';i++){TOWN_WALK.tick(.05);townAutoTick();}
        check(rb.C.phase==='seek'&&!tw.bags.some(i=>i.junk),'on Auto your hero visits the smithy, then walks out of the gate');
        const wk=World.walker({map:()=>({rows:['...','.#.','...']}),tiles:{'.':{},'#':{solid:1}},pos:()=>wpos,on:{}}),wpos={x:0,y:0,dir:'down'};wk.place(0,0);
        check(wk.walkTo(2,2)&&wk.path.length===4,'the shared walker finds the shortest way around walls');
        // S4 part 2: Wildclan camps, the Abbey, and the guild hall you walk into
        const wv=rb.newHero('Campcheck','wild','grishar','hunter');wv.lvl=45;rb.S.chars=[wv];rb.S.cur=wv.id;rb.boot();
        check(townKind()==='camp'&&TOWN.map.rows.some(r=>r.includes('F'))&&buildingName(TOWN_BUILDINGS[0])==='Longhouse','Wildclan hubs are camps around a firepit');
        const cv2=rb.newHero('Abbeycheck','concord','human','priest');cv2.lvl=45;cv2.zone='thornvale';rb.S.chars=[cv2];rb.S.cur=cv2.id;rb.boot();
        check(townKind()==='town'&&buildingName(TOWN_BUILDINGS[0])==='Abbey'&&TOWN.map.rows.some(r=>r.includes('O')),'Thornvale\'s inn is the Abbey, and Concord towns have a fountain');
        const kg=rb.S.guild,kb=rb.S.bank;rb.S.guild={jobs:{}};rb.S.bank={};cv2.money=60000;rb.C.phase='intown';for(const n of cv2.npcs.slice(0,5)){n.met=true;n.aff=AFFINITY[2].at;}foundGuild('Hallcheck');
        TOWN.inside=true;check(TOWN.map===GUILD_HALL&&hallPeople().filter(p=>p.id==='member').length===5,'inside the hall your guild adventurers gather');
        TOWN_WALK.place(7,8,'up');check(GUILD_HALL.rows.every(r=>r.length===16)&&TOWN_WALK.walkTo(2,3)&&TOWN_WALK.walkTo(13,3)&&TOWN_WALK.walkTo(13,8),'you can walk the whole hall, from the chest to the jobs board');
        const mk=Object.keys(rb.S.guild.members)[0],mw=workerOf(mk);rb.S.bank={ore:10,kit:2,herb:8,potion:2};while(RTALK)SCN.skip();memberTalk(mk);
        const asked=!!RTALK&&RTALK.choices&&RTALK.choices.length===2;SCN.choose(0);check(asked&&rb.S.guild.requests[mk],'a member asks their favor in the hall and you can give it there');
        while(RTALK)SCN.skip();memberTalk(mk);check(!!RTALK&&!RTALK.choices,'afterwards they just talk, by mood');while(RTALK)SCN.skip();
        townExit();const gb=TOWN_BUILDINGS.find(b=>b.kind==='guild');check(!TOWN.inside&&TOWN.pos.x===gb.door&&TOWN.pos.y===gb.y+gb.h,'the hall door leads back out in front of the hall');
        rb.S.guild=kg;rb.S.bank=kb;if(!kg)delete rb.S.guild;if(!kb)delete rb.S.bank;
        rb.S.chars=keepC;rb.S.cur=keepCur;rb.S.tab='quests';if(H())rb.boot();}
      // Rain audio follows outdoor ambience and never invents dungeon rain.
      {const hero=rb.newHero('Raincheck','concord','human','mage'),keepCur=rb.S.cur,keepWeather=zoneWeather;rb.S.chars.push(hero);rb.S.cur=hero.id;rb.boot();
        try{hero.dun=null;for(const [weather,level] of [['clear',0],['rain',.65],['drizzle',.3],['storm',1],['snow',0],['fog',0],['ashfall',0]]){
          zoneWeather=()=>weather;check(rainLevel()===level,'rain sound level follows '+weather);}
          zoneWeather=()=> 'storm';hero.dun={id:'sanctum'};check(rainLevel()===0,'dungeon ambience has no outdoor rain sound');
        }finally{zoneWeather=keepWeather;rb.S.chars=rb.S.chars.filter(c=>c!==hero);rb.S.cur=keepCur;if(H())rb.boot();}}
      // Member requests: supply handoff, friendship, persistence and protection against repeat rewards.
      {const keepG=rb.S.guild,keepB=rb.S.bank,keepChars=rb.S.chars,keepCur=rb.S.cur;
        const lead=rb.newHero('Requestlead','concord','human','warrior'),alt=rb.newHero('Requestalt','concord','human','mage');lead.lvl=45;alt.lvl=45;
        rb.S.chars=[lead,alt];rb.S.cur=lead.id;rb.S.bank={ore:0,kit:0,herb:0,potion:0};rb.S.guild={jobs:{}};rb.boot();
        const npc=lead.npcs[0],key=memberKey(lead.id,npc.id);check(!memberRequest(key)&&!fulfillMemberRequest(key),'requests need a founded guild and real member');
        rb.S.guild={jobs:{},name:'The Helpers',founded:Date.now(),level:1,xp:0,members:{}};npc.met=true;npc.aff=30;addMember(npc,lead,true);
        check(memberRequest(key)&&!rb.S.guild.requests,'legacy guild gets a request without rendering a new save field');
        for(const cls of Object.keys(CLASSES)){npc.cls=cls;check(MEMBER_REQUESTS[cls]&&memberRequest(key).count>0,'first favor exists for '+cls);}
        npc.cls='warrior';rb.C.phase='seek';rb.S.bank.kit=2;const before=JSON.stringify(rb.S);check(!fulfillMemberRequest(key)&&JSON.stringify(rb.S)===before,'field requests cannot spend supplies or award rewards');
        rb.C.phase='intown';lead.dun={id:'sanctum'};check(!fulfillMemberRequest(key)&&rb.S.bank.kit===2,'requests cannot be completed inside a dungeon');lead.dun=null;
        rb.S.bank.kit=0;check(!fulfillMemberRequest(key)&&rb.S.bank.kit===0&&rb.S.guild.xp===0,'missing supplies leave progress unchanged');
        rb.S.bank.kit=2;check(ROSTER.assign(key,'mine'),'request member can still take a normal job');check(!fulfillMemberRequest(key)&&/Return/.test(requestProblem(key))&&rb.S.bank.kit===2,'a working member must return before a handoff');ROSTER.stop(key);
        npc.pers='shy';const mood=rb.S.guild.members[key].mood,aff=npc.aff;
        rb.S.tab='supplies';renderTab(true);check(!document.querySelector('[data-act="guildrequest"][data-arg="'+key+'"]'),'guild records no longer complete favors remotely');const requestWidth=PW;PW=1000;TOWN.inside='guild';memberTalk(key);check(RTALK&&RTALK.choices[0].includes('Give'),'member offers a favor in a portrait scene');SCN.skip();SCN.choose(0);TOWN.inside=false;PW=requestWidth;
        check(rb.S.bank.kit===1&&rb.S.guild.xp===15&&rb.S.guild.members[key].mood===mood+10&&npc.aff===aff+3,'actual portrait choice consumes one kit and awards exactly the displayed rewards');
        check(npc.notes.some(n=>n.includes('shield worth lending'))&&lead.log.some(n=>n.includes('Helped '+npc.name)),'favor is recorded in companion memory and hero journal');
        check(!memberRequest(key)&&!fulfillMemberRequest(key)&&rb.S.bank.kit===1&&rb.S.guild.xp===15,'a double click cannot consume supplies or award rewards again');
        check(/Helped: A shield worth lending/.test(guildHTML()),'completed favor stays visible in the hall');
        dismissMember(key);check(inviteToGuild(npc.id)&&!memberRequest(key)&&!fulfillMemberRequest(key)&&rb.S.guild.xp===15,'dismissal and reinvitation do not reset a completed favor');
        const other=alt.npcs[0];other.cls='priest';other.pers='scholarly';other.met=true;other.aff=30;addMember(other,alt,true);const otherKey=memberKey(alt.id,other.id);rb.S.bank.potion=1;
        const ownAff=npc.aff;check(fulfillMemberRequest(otherKey)&&rb.S.bank.potion===0&&other.aff===33&&npc.aff===ownAff&&rb.S.guild.members[otherKey].mood===70,'any hero can help another hero\'s member through the shared bank without changing the wrong companion');
        const requestCopy=JSON.stringify(rb.S.guild.requests);rb.save();const saved=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1')));check(JSON.stringify(saved.guild.requests)===requestCopy,'completed requests persist through save and migration');
        const legacy=JSON.parse(JSON.stringify(saved));delete legacy.guild.requests;check(Object.keys(rb.migrate(legacy).guild.requests).length===0,'legacy guild saves default the request ledger');
        check(!fulfillMemberRequest('adv:missing:missing')&&!fulfillMemberRequest(String(lead.id)),'stale or character keys cannot claim adventurer favors');
        check(Object.keys(PERSONALITY).every(k=>REQUEST_VOICE[k]&&REQUEST_VOICE[k].hello&&REQUEST_VOICE[k].thanks),'every existing personality has original offer and thanks dialogue');
        rb.S.chars=keepChars;rb.S.cur=keepCur;rb.S.guild=keepG;rb.S.bank=keepB;if(!keepG)delete rb.S.guild;if(!keepB)delete rb.S.bank;rb.S.tab='quests';if(H())rb.boot();}
      // S6: the light engine. The sun crosses the sky, shadows follow it, and a cast shadow really darkens the ground
      {const m=LT.time(.03),n=LT.time(.25),e=LT.time(.47),nt=LT.time(.75);
        check(m.day&&n.day&&e.day&&!nt.day&&n.elev>.99&&m.elev<.2,'the sun rises, peaks at noon and sets; the moon rules the night');
        check(m.shadow.sx>0&&e.shadow.sx<0&&Math.abs(m.shadow.sx)>Math.abs(n.shadow.sx),'shadows point away from the sun and are longest at dawn and dusk');
        check(e.golden>.5&&n.golden<.2&&nt.grade.col,'golden hour, and a night grade');
        check(Math.abs(Light.cycle(.955,.955,.645))<1e-9&&Math.abs(Light.cycle(.645,.955,.645)-.5)<1e-9,'a game clock maps onto sunrise and sunset');
        const keepG=rb.S.gfx;rb.S.gfx='high';const c=document.createElement('canvas');c.width=200;c.height=200;const g=c.getContext('2d');g.fillStyle='#88ff88';g.fillRect(0,0,200,200);
        LT.cast(g,cc=>{cc.fillStyle='#f00';cc.fillRect(90,60,20,80);},[90,60,20,80],140,LT.time(.06),{});const d=g.getImageData(125,150,1,1).data;
        if(keepG===undefined)delete rb.S.gfx;else rb.S.gfx=keepG;check(d[1]<230&&d[0]<130,'a cast shadow darkens the ground where it falls (High quality)');
        check(typeof realmSun()==='object'&&ZONE_LIGHT.fens.fog>ZONE_LIGHT.redsand.fog,'every zone has its own air: the Fens are foggier than the Redsand Steppe');}
      // G2: winter haze is low, weather still matters, and the shared clock still directs the shadows.
      {rb.S.cur=h.id;rb.boot();const hero=H(),keepZone=hero.zone,keepDun=hero.dun,keepPhase=C.phase,keepWeather=window.GM_WEATHER;
        const fog=LT.fog,grade=LT.grade,shafts=LT.shafts,keepPW=PW,keepPH=PH,keepCW=cv.width,keepCH=cv.height;let air,beam;
        try{
          PW=PW||480;PH=PH||240;cv.width=PW;cv.height=PH; // The runner's collapsed iframe may have an unsized scene.
          hero.dun=null;hero.zone='frostmere';
          const noon=AMB_DAY*1000*.3,morning=realmSun(AMB_DAY*1000*.97),evening=realmSun(AMB_DAY*1000*.62),night=realmSun(AMB_DAY*1000*.8);
          check(morning.day&&evening.day&&morning.shadow.sx*evening.shadow.sx<0,'Frostmere shadows swing with the same dawn-to-dusk sun');
          check(!night.day&&night.shade[2]>night.shade[0],'Frostmere moon shadows retain cool reflected snow light');
          LT.fog=(g,w,hh,t,o)=>{air=o;};LT.grade=()=>{};LT.shafts=(g,w,hh,t,st,o)=>{beam=o.strength;};
          realmAtmosphere(0,PH*.78,realmSun(noon),[],AMB_WEATHER.clear);
          const clear=air.density;
          check(air.top>PH*.5&&air.top<air.ground,'Frostmere clear-weather haze starts below the skyline and rises from the snow');
          realmAtmosphere(0,PH*.78,realmSun(noon),[],AMB_WEATHER.blizzard);
          check(air.density>clear&&air.density<1,'a Frostmere blizzard thickens low haze without opaque fog');
          beam=null;realmAtmosphere(0,PH*.78,realmSun(noon),[],AMB_WEATHER.rain);
          check(beam===null,'winter rain suppresses direct light shafts');
          const lamps=[{x:PW*.3,y:PH*.6,r:PH*.25,col:'#ffc860'}];
          realmAtmosphere(0,PH*.78,night,lamps,AMB_WEATHER.clear);
          check(air.lights===lamps&&air.density>clear,'winter night haze keeps the real warm lights for scattering');
          C.phase='intown';window.GM_WEATHER='clear';townEnter();drawTown(0);
          check(air.top>PH*.5&&air.top<air.ground,'Frostmere walkable lodge also keeps haze below the skyline');
          for(const zone of Object.keys(ZONES).filter(z=>z!=='frostmere')){
            hero.zone=zone;const z=ZONES[zone],a=ZONE_LIGHT[zone]||{},expected=LT.time(Light.cycle(.3,.955,.645),{sky:a.bounceSky||z.sky[1],ground:a.bounceGround||z.ground});
            check(JSON.stringify(realmSun(noon))===JSON.stringify(expected),zone+' bounce light uses its own colours, or the zone\'s sky and ground');
          }
          // G2 (Claude): every zone has its own night colour, and dusk stays warm while the sun is still up
          const nights=Object.keys(ZONES).map(zone=>(ZONE_LIGHT[zone]||{}).night);
          check(nights.every(c=>/^#[0-9a-f]{6}$/i.test(c||''))&&new Set(nights).size===nights.length,'every zone has its own night colour');
          const lightsFn=AMB.lights;let dark=null,tint=null;AMB.lights=(g,w,hh,t,o)=>{dark=o.dark;tint=o.tint;};
          try{hero.zone='redsand';const dusk=AMB_DAY*1000*.63,late=AMB_DAY*1000*.8;
            ambFront(0,PH*.78,4,{P:{fx:{},nightFx:{}},W:{},lights:[],night:realmNight(dusk),sun:realmSun(dusk)});
            check(realmSun(dusk).day&&realmNight(dusk)>0&&dark!==null&&dark<=realmNight(dusk)*.31,'golden hour only hints at dusk while the sun is up (no grey wash)');
            dark=null;ambFront(0,PH*.78,4,{P:{fx:{},nightFx:{}},W:{},lights:[],night:realmNight(late),sun:realmSun(late)});
            check(dark===realmNight(late)&&tint===ZONE_LIGHT.redsand.night,'after sunset the full night falls, in the zone\'s own colour');
          }finally{AMB.lights=lightsFn;}
          hero.dun={id:'barrows',tier:0,step:0,mods:[]};beam=null;realmAtmosphere(0,PH*.78,realmSun(noon),[],{});
          check(air.top===PH*.3&&beam===0,'Silent Barrows keeps its existing dungeon fog and no sun shafts');
        }finally{LT.fog=fog;LT.grade=grade;LT.shafts=shafts;PW=keepPW;PH=keepPH;cv.width=keepCW;cv.height=keepCH;hero.zone=keepZone;hero.dun=keepDun;C.phase=keepPhase;
          if(keepWeather===undefined)delete window.GM_WEATHER;else window.GM_WEATHER=keepWeather;}
      }
      // T21: every generated item category follows the widened name bands.
      check([...Object.values(MAT),...Object.values(WEAPONS).map(w=>w.names),...Object.values(OFFH),TRINKETS].every(names=>names.length===8&&new Set(names).size===8),'every tiered item list has eight distinct names');
      check(BLUE_PRE.length===17&&new Set(BLUE_PRE).size===17,'rare prefix pool retains seven names and adds ten distinct dungeon names');
      for(const [ilvl,tier] of [[1,0],[16,3],[25,4],[35,5],[45,6],[55,7]]){
        check(Object.entries(WEAPONS).every(([type,w])=>genItem(ilvl,1,'weapon',{cls:'warrior',type}).name===w.names[tier]),'weapon names use tier '+tier+' at item level '+ilvl);
        check(Object.entries(MAT).every(([atype,names])=>genItem(ilvl,1,'chest',{cls:'warrior',atype}).name.startsWith(names[tier]+' ')),'armor names use tier '+tier+' at item level '+ilvl);
        check(Object.entries(OFFH).every(([type,names])=>genItem(ilvl,1,'offhand',{cls:'warrior',type}).name===names[tier]),'off-hand names use tier '+tier+' at item level '+ilvl);
        check(genItem(ilvl,2,'trinket',{cls:'warrior',suffix:'bear'}).name===TRINKETS[tier]+' of the Bear','trinket names use tier '+tier+' at item level '+ilvl);
      }
      for(const [ilvl,tier] of [[5,0],[6,1],[10,1],[11,2],[15,2],[20,3],[21,4],[30,4],[31,5],[40,5],[41,6],[50,6],[51,7],[60,7],[61,7],[100,7]]){
        check(genItem(ilvl,1,'weapon',{cls:'warrior',type:'sword'}).name===WEAPONS.sword.names[tier]&&
          genItem(ilvl,1,'chest',{cls:'warrior',atype:'mail'}).name.startsWith(MAT.mail[tier]+' ')&&
          genItem(ilvl,1,'offhand',{cls:'warrior',type:'shield'}).name===OFFH.shield[tier]&&
          genItem(ilvl,2,'trinket',{cls:'warrior',suffix:'bear'}).name===TRINKETS[tier]+' of the Bear','item name boundary at level '+ilvl+' uses tier '+tier);
      }
      rb.S.cur=h.id;rb.boot();
      const oldBlade=genItem(45,1,'weapon',{cls:'warrior',type:'sword'});oldBlade.name='Tempered Longblade';rb.S.chars.find(c=>c.id===h.id).bags.push(oldBlade);rb.save();
      const saved=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1'))).chars.find(c=>c.id===h.id).bags.find(it=>it.id===oldBlade.id);
      check(saved.name==='Tempered Longblade'&&saved.ilvl===45,'saved high-level items retain their original generated names');

      // R9: exercise real encounter spawning and loot delivery, not a copy of the generator.
      const review = rb.newHero('Heroic Reviewer','concord','human','warrior');
      review.lvl=60;review.mode='focus';for(const n of review.npcs)n.offset=0;
      rb.S.chars=[review];rb.S.cur=review.id;rb.boot();
      const reviewParty=review.npcs.slice(0,4).map(n=>n.id);
      for(const id of ['sanctum','foundry','rootrot','heartwood']){
        const def=rb.DUNGEONS[id],tiers=['rootrot','heartwood'].includes(id)?Array.from({length:31},(_,n)=>n).concat(40):[0,1,4,10,28,29,40];
        check(def.enc.filter(e=>e.boss).map(e=>e.loot).join(',')==='2,2,3',id+': three bosses share the established seven-item reward budget');
        check(def.enc.filter(e=>!e.boss).every(e=>!e.loot),id+': trash does not award boss gear');
        for(const tier of tiers){
          review.zone=def.zone;review.dun=null;rb.boot();const record=rb.dungeonStats(id);record.best=tier-1;
          rb.startDungeon(tier+1,reviewParty,id);check(!review.dun,id+' Heroic '+tier+': cannot skip the next earned tier');
          rb.startDungeon(tier,reviewParty,id);check(review.dun&&review.dun.tier===tier,id+' tier '+tier+': next earned tier is playable');
          check(review.dun.mods.length===(tier>=4?2:tier>=1?1:0)&&new Set(review.dun.mods).size===review.dun.mods.length,id+' tier '+tier+': correct distinct modifiers');
          const clears=record.clears,keepTake=takeLoot;let count=0;
          try{
            // Keep review fixtures out of bags while retaining the actual boss loot panel.
            takeLoot=()=>{};
            for(let step=0;step<def.enc.length;step++){
              review.dun.step=step;rb.spawnDungeon();const mob=rb.C.mob,e=def.enc[step],tm=Math.pow(1.3,tier),mods=review.dun.mods;
              const hp=e.boss?(30+e.lvl*28)*e.hpM*(mods.includes('tyrannical')?1.3:1):(30+e.lvl*28)*1.1*e.n*(e.hpM||1)*(mods.includes('fortified')?1.3:1);
              const damage=(3+e.lvl*2.3)*(e.boss?e.dmgM*(mods.includes('tyrannical')?1.15:1):(.6+.4*e.n)*1.3)*tm;
              check(mob.max===Math.round(hp*tm)&&Math.abs(mob.dmg-damage)<Math.max(1,damage)*1e-12,id+' tier '+tier+' encounter '+step+': health and damage match earned Heroic difficulty');
              rb.C.lastInput=rb.C.run;dunKill(mob);const gear=rb.C.loot&&rb.C.loot.items||[];
              check(gear.length===(e.loot||0),id+' tier '+tier+' encounter '+step+': exact boss gear count reaches the loot panel');
              for(const it of gear){
                check(it.ilvl===e.lvl+1+2*tier+(it.rar===4?3:0)&&[3,4].includes(it.rar)&&(!e.final?it.rar===3:true),id+' tier '+tier+': boss reward item level and rarity');
                check(it.name&&!it.name.includes('undefined')&&it.dur===100&&Number.isFinite(it.value)&&Object.values(it.stats).every(v=>Number.isFinite(v)&&v>0),id+' tier '+tier+': generated reward remains valid beyond level 60');
                if(tier>=29&&e.final)check(it.rar===4,id+' tier '+tier+': established final-boss Epic chance has saturated');
              }
              count+=gear.length;
              if(e.final){check(record.clears===clears,id+' tier '+tier+': final loot waits for collection before recording clear');rb.C.loot.items=[];afterDungeonPull();}
            }
          }finally{takeLoot=keepTake;}
          check(count===7&&record.best===tier&&record.clears===clears+1&&!review.dun,id+' tier '+tier+': collection records one clear and unlocks the next Heroic');
        }
      }
      // Normal and Heroic progression and earned items survive an ordinary old-format save.
      review.drecords.rootrot={best:4,clears:5,runs:7};review.drecords.heartwood={best:1,clears:2,runs:3};
      review.bags=[genItem(61,3,'chest',{cls:'warrior'}),genItem(64,4,'weapon',{cls:'warrior'})];
      rb.save();const restored=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1'))).chars.find(c=>c.id===review.id);
      check(JSON.stringify(restored.drecords)===JSON.stringify(review.drecords)&&JSON.stringify(restored.bags)===JSON.stringify(review.bags),'R9: old-format save retains independent Heroic records and earned high-level loot');
      // L7b: award composition, early-entry boundaries and old-save continuity.
      const xpHero=rb.newHero('Pacing Reviewer','concord','human','warrior');
      rb.S.chars=[xpHero];rb.S.cur=xpHero.id;rb.boot();
      const keepGuild=rb.S.guild,keepParty=rb.C.party;
      try{
        rb.S.guild={jobs:{}};rb.C.party=[];xpHero.pace='classic';
        for(const zone of Object.keys(rb.ZONES))for(const level of [38,40]){
          xpHero.zone=zone;xpHero.lvl=level;xpHero.xp=0;xpHero.rested=0;
          rb.gainXP(1000,false);
          const late=['barrowfield','hollowcrown','crownheart'].includes(zone)&&level>=40;
          check(xpHero.xp===(late?600:1000),zone+' level '+level+': late budget leaves earlier zones and early entry unchanged');
        }
        xpHero.zone='crownheart';xpHero.lvl=52;
        rb.S.guild={founded:1,level:5,jobs:{},members:{},xp:0};
        rb.C.party=[{},{},{},{}];
        for(const [pace,mult] of [['breezy',1.6],['classic',1],['long',.6]]){
          xpHero.pace=pace;xpHero.xp=0;xpHero.rested=100;
          rb.gainXP(groupXP(1000),true);
          const earned=Math.round(280*mult*1.1*.6);
          check(xpHero.xp===earned+100&&xpHero.rested===0,pace+': party split, guild and zone budget compose before consuming rested XP');
          xpHero.xp=0;xpHero.rested=100;rb.gainXP(1000,false);
          check(xpHero.xp===Math.round(1000*mult*1.1*.6)&&xpHero.rested===100,pace+': quest award stays whole and does not consume rested XP');
        }
        xpHero.xp=12345;xpHero.rested=6789;rb.save();
        const old=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1'))).chars.find(c=>c.id===xpHero.id);
        check(old.xp===12345&&old.rested===6789&&old.lvl===52,'late-zone tuning does not rewrite earned XP, rested XP or saved levels');
      }finally{rb.S.guild=keepGuild;rb.C.party=keepParty;}

      // RB1.5: deliberate conversations and the first victory protect Focus from fallback.
      {
        const hero=newHero('Patient Reader','concord','human','warrior');S.chars=[hero];S.cur=hero.id;boot();
        accept(firstErrand(hero).id);beginArrival(false);C.run=40;C.lastInput=-99;updateWorld();
        check(!aiOn()&&!$('#modeHint').textContent.includes('Autopilot'),'RB1.5: arrival never advertises or enables fallback');
        SCN.skip();C.run=100;check(!aiOn(),'RB1.5: no Focus fallback before a first victory, however long the wait');
        const untouched=JSON.stringify({xp:hero.xp,kills:hero.stats.kills,money:hero.money});offline(3600,true);
        check(JSON.stringify({xp:hero.xp,kills:hero.stats.kills,money:hero.money})===untouched,'RB1.5: away time cannot manufacture the first victory');
        spawn();C.mob.hp=0;onKill();const victoryAt=C.run;
        check(hero.stats.kills===1&&!aiOn(),'RB1.5: a real first victory starts the grace period');
        C.run= victoryAt+15;check(!aiOn(),'RB1.5: full fifteen seconds after the first victory');
        C.run+=.01;check(aiOn(),'RB1.5: established Focus fallback resumes after fifteen seconds');
        hero.mode='auto';SCN.play([['Farmer Aldous','Take your time.']],null);
        const before=JSON.stringify(C);step(30);check(JSON.stringify(C)===before&&!aiOn(),'RB1.5: every dialogue pauses combat even in explicit Auto');

        hero.quests.active=[firstErrand(hero).id];hero.quests.prog[firstErrand(hero).id]=99;
        questHelper();check(!hero.quests.done[firstErrand(hero).id],'RB1.5: QuestHelper cannot choose rewards behind a conversation');
        const kills=hero.stats.kills;offline(3600,true);check(hero.stats.kills===kills,'RB1.5: long background gaps cannot hunt behind a conversation');
        SCN.skip();check(aiOn(),'RB1.5: explicitly chosen Auto resumes after dialogue');
        hero.mode='focus';C.lastInput=C.run;check(!aiOn(),'RB1.5: manual control resets established fallback');
        const legacy=migrate({v:1,cur:hero.id,chars:[JSON.parse(JSON.stringify(hero))],last:Date.now()}).chars[0];
        check(legacy.stats.kills===1,'RB1.5: existing victory record survives save migration without a new field');
      }

      // L4/V1: both faction requests, every resource, optional guidance and legacy saves.
      for(const faction of ['concord','wild'])for(const cls of Object.keys(CLASSES)){
        const hero=rb.newHero('Roadtester',faction,FACTIONS[faction].races[0],cls);
        rb.S.chars=[hero];rb.S.cur=hero.id;rb.boot();const q=QUESTS[hero.zone][0];rb.accept(q.id);
        beginArrival(false);
        check(arrivalPaused()&&RTALK.lines.some(l=>l[0]===giver(q)&&l[1]===q.text),faction+'/'+cls+': existing giver speaks the real first request');
        const before={run:rb.C.run,hp:rb.C.hp,xp:hero.xp,money:hero.money,play:hero.stats.play};rb.step(30);
        check(rb.C.run===before.run&&rb.C.hp===before.hp&&hero.xp===before.xp&&hero.money===before.money&&hero.stats.play===before.play,faction+'/'+cls+': no combat or play time behind arrival');
        SCN.skip();check(!arrivalPaused()&&!RTALK&&hero.onboarding.arrival,faction+'/'+cls+': Skip resumes the world');
        check(hero.quests.active.filter(id=>id===q.id).length===1,faction+'/'+cls+': first quest accepted exactly once');
        rb.boot();check(!RTALK,faction+'/'+cls+': completed arrival does not replay on load');
        rb.C.phase='fight';rb.spawn();rb.C.gcd=0;rb.C.cast=null;rb.C.res=CLASSES[cls].res==='rage'?0:ST.resMax;
        const action=roadAction(),hint=roadHint();
        check(hint&&hint.id==='fight'&&hint.text.includes('15 seconds')&&hint.text.includes('Basic attacks'),faction+'/'+cls+': existing Focus and fallback explained');
        const available=bar().find(a=>canUse(a,true));
        check(available?action.includes(available.name)&&knows(available.id):action.includes('Rage'),faction+'/'+cls+': advice follows usable action or rage limitation');
        const run=rb.C.run;rb.step(.1);check(rb.C.run>run,faction+'/'+cls+': combat resumes after Skip');
        hero.stats.manual=1;rb.C.phase='loot';rb.C.mob=null;rb.C.loot={money:5,items:[genItem(1,1,'hands',{cls})]};
        check(roadHint().id==='loot'&&roadHint().text.includes('60 manual loots'),faction+'/'+cls+': corpse hint respects earned AutoLoot');
        const money=hero.money;lootAll();check(hero.money===money+5&&hero.stats.loots===1&&roadHint().id==='bags',faction+'/'+cls+': manual loot connects to Bags without auto equip');
        check(!hero.addons.unl.autoloot&&!hero.addons.unl.questhelper,faction+'/'+cls+': guidance grants no addons');
        hero.quests.prog[q.id]=q.n;check(roadHint().id==='reward',faction+'/'+cls+': objective readiness points to reward choice');
        hero.bags=Array.from({length:16},()=>({id:uid(),junk:true,name:'Test scrap',value:1}));const xp=hero.xp;
        rb.turnIn(q.id,0,false);check(!hero.quests.done[q.id]&&hero.xp===xp&&roadHint().id==='reward',faction+'/'+cls+': full bag keeps the reward available and explains recovery');
        hero.bags=[];rb.turnIn(q.id,0,false);check(hero.quests.done[q.id]&&roadHint().id==='home',faction+'/'+cls+': real turn-in leads to optional town visit');
        hero.onboarding.hints.home=true;rb.C.phase='intown';
        check(roadHint().id==='town'&&roadHint().text.includes('Repairs are optional'),faction+'/'+cls+': no paid service blocks guidance');
        hero.money=0;rb.C.hp=1;townDoor({kind:'inn'});check(rb.C.hp===ST.hpMax&&hero.money===0,faction+'/'+cls+': existing free inn rest works without money');
        hero.stats.equips=1;rb.C.phase='seek';const n=hero.npcs[0];rb.C.enc={id:n.id,t:25,kind:'resting',waved:false};
        const party=hero.party.slice(),aff=n.aff;check(roadHint().id==='companion'&&roadHint().title.includes(n.name)&&roadHint().text.includes(ROLE_NAME[roleOf(n)].toLowerCase()),faction+'/'+cls+': introduces an actual encountered companion and role');
        renderRoadGuide();check(n.aff===aff&&hero.party.join(',')===party.join(','),faction+'/'+cls+': companion introduction never auto recruits or grants affinity');
        hero.onboarding.hints.companion=true;check(!roadHint(),faction+'/'+cls+': dismissed companion guidance stays dismissed');
        delete hero.onboarding;const legacy=rb.migrate(JSON.parse(JSON.stringify(rb.S))).chars[0];
        check(legacy.onboarding===null&&legacy.money===hero.money&&legacy.quests.done[q.id],faction+'/'+cls+': legacy default preserves money and quests');
        rb.S.chars=[legacy];rb.S.cur=legacy.id;rb.boot();check(!RTALK&&!roadHint(),faction+'/'+cls+': legacy hero is not unexpectedly guided');
        const saved=JSON.stringify(legacy);beginArrival(true);check(arrivalPaused(),faction+'/'+cls+': deliberate replay pauses its scene');SCN.skip();
        check(JSON.stringify(legacy)===saved&&!arrivalPaused(),faction+'/'+cls+': replay changes no hero progress or mode');
      }
      const interrupted=rb.newHero('Interrupted','concord','human','mage');rb.S.chars=[interrupted];rb.S.cur=interrupted.id;rb.boot();rb.accept('t1');beginArrival(false);clearArrival();
      check(!RTALK&&!arrivalPaused()&&!interrupted.onboarding.arrival,'interrupted arrival clears scene and safely stays pending');rb.boot();check(arrivalPaused(),'pending arrival resumes after reloading');SCN.skip();
      const historical=JSON.parse(JSON.stringify(interrupted));delete historical.onboarding;
      check(rb.migrate({hero:historical}).chars[0].onboarding===null,'single-hero historical save defaults to no onboarding');
      interrupted.onboarding={arrival:true,hints:null};check(!roadState(interrupted)&&!roadHint(),'malformed optional guidance is ignored safely');
      // R4: every named adventurer, both choices, present-party time and durable memories.
      {
      const storyHero=rb.newHero('Story Listener','concord','human','warrior'), storyAlt=rb.newHero('Other Listener','wild','grishar','mage');
      storyHero.onboarding=null;storyAlt.onboarding=null;storyHero.lvl=60;storyAlt.lvl=60;
      rb.S.chars=[storyHero,storyAlt];rb.S.cur=storyHero.id;rb.S.guild={founded:1,name:'The Story Hearth',level:1,xp:0,members:{},jobs:{},requests:{},stories:{}};rb.S.bank={ore:12,kit:3,herb:8,potion:4};rb.boot();rb.C.phase='intown';TOWN.inside=true;
      const allStoryNpcs=[...storyHero.npcs.map(n=>({n,owner:storyHero})),...storyAlt.npcs.map(n=>({n,owner:storyAlt}))];
      check(Object.keys(MEMBER_STORIES).length===32&&allStoryNpcs.every(({n})=>MEMBER_STORIES[n.name]),'R4: all 32 faction adventurers have an original personal arc');
      check(new Set(Object.values(MEMBER_STORIES).map(s=>s[0])).size===32,'R4: each adventurer has their own story title');
      for(const {n,owner} of allStoryNpcs){
        n.aff=30;n.met=true;addMember(n,owner,true);const key=memberKey(owner.id,n.id),w=workerOf(key),story=MEMBER_STORIES[n.name];
        check(story.length===7&&story.every(line=>typeof line==='string'&&line.length>5)&&story[5]!==story[6],n.name+': three voiced moments with two distinct outcomes');
        const generated={cls:n.cls,race:n.race,pers:n.pers,hair:n.hair};
        for(const branch of [0,1]){
          rb.S.guild.stories[key]={seconds:0,done:0,choice:null};w.m.mood=80;n.aff=30;
          for(let beat=0;beat<3;beat++){
            const state=memberStoryState(key),gate=MEMBER_STORY_GATES[beat];state.seconds=gate.seconds-.1;w.m.mood=80;
            check(/time on the road/.test(memberStoryProblem(key))&&!finishMemberStory(key,beat,0),n.name+'/'+branch+'/'+beat+': shared time gates completion');
            state.seconds=gate.seconds;w.m.mood=gate.mood-.1;
            check(/mood/.test(memberStoryProblem(key))&&!finishMemberStory(key,beat,0),n.name+'/'+branch+'/'+beat+': mood gates completion');
            w.m.mood=gate.mood;n.aff=29;check(/Friends/.test(memberStoryProblem(key)),n.name+'/'+branch+'/'+beat+': friendship remains required');n.aff=30+2*beat;
            check(memberStoryProblem(key)===''&&playMemberStory(key,false),n.name+'/'+branch+'/'+beat+': ready member opens existing portrait dialogue');
            check(RTALK.memberStory&&hallPeople().some(p=>p.key===key)&&MEMBER_STORY_FACE.name===n.name&&MEMBER_STORY_FACE.hairCol===n.hair&&MEMBER_STORY_FACE.shirt===CLASSES[n.cls].col&&RTALK.lines.some(l=>l[1]===(memberStoryHurt(state)&&beat===2?'I have something harder to remember with you.':MEMBER_STORY_VOICE[n.pers][beat])),n.name+'/'+branch+'/'+beat+': generated personality has its own voice');
            const run=rb.C.run,play=storyHero.stats.play;rb.step(.1);check(rb.C.run===run&&storyHero.stats.play===play,n.name+'/'+branch+'/'+beat+': deliberate scene pauses game time');
            SCN.skip();check(state.done===beat&&RTALK,n.name+'/'+branch+'/'+beat+': Skip reveals choices without accepting them');
            const stale=RTALK.done;SCN.choose(beat===1?2:1);check(state.done===beat&&!RTALK,n.name+'/'+branch+'/'+beat+': Another time grants no progress');
            playMemberStory(key,false);SCN.skip();SCN.choose(beat===1?branch:0);
            if(beat===1&&state.reaction){check(RTALK&&RTALK.memberStory&&RTALK.lines.some(l=>l[1]===memberStoryResult(n.name,state)),n.name+'/'+branch+': decision speaks its consequence in the world');SCN.skip();SCN.choose(memberStoryHurt(state)?1:0);}
            const hurtDecision=beat===1&&memberStoryHurt(state);
            check(state.done===beat+1&&n.aff===(hurtDecision?30+2*beat:32+2*beat)&&w.m.mood===gate.mood+(hurtDecision?-8:2),n.name+'/'+branch+'/'+beat+': explicit response grants one small relationship reward');
            const aff=n.aff,mood=w.m.mood;stale(beat===1?branch:0);check(n.aff===aff&&w.m.mood===mood,n.name+'/'+branch+'/'+beat+': stale callback cannot reward a second time');
          }
          const state=memberStoryState(key);check(state.choice===branch&&state.done===3&&memberStoriesHTML().includes(memberStoryScript(n.name,state)[5+branch]),n.name+'/'+branch+': remembered ending appears in the hall');
          const saved=JSON.stringify(state),aff=n.aff,mood=w.m.mood;check(playMemberStory(key,true),'R4 '+n.name+': deliberate replay opens');SCN.skip();SCN.choose(memberStoryHurt(state)?1:0);
          check(JSON.stringify(state)===saved&&n.aff===aff&&w.m.mood===mood,n.name+'/'+branch+': replay is read-only');
          check(!finishMemberStory(key,2,0)&&!playMemberStory(key,false),n.name+'/'+branch+': completed arc cannot be repeated');
        }
        check(JSON.stringify(generated)===JSON.stringify({cls:n.cls,race:n.race,pers:n.pers,hair:n.hair}),n.name+': stories preserve generated identity');
      }
      const local=storyHero.npcs[0],remote=storyAlt.npcs[0],localKey=memberKey(storyHero.id,local.id),remoteKey=memberKey(storyAlt.id,remote.id);
      rb.S.guild.stories[localKey]={seconds:0,done:0,choice:null};rb.S.guild.stories[remoteKey]={seconds:0,done:0,choice:null};
      rb.C.phase='seek';rb.C.party=[{n:local,dead:false},{n:local,dead:false},{n:raidGuild(remoteKey),dead:false},{n:{alt:true},dead:false}];
      memberStoryTick(.5);check(memberStoryState(localKey).seconds===.5&&memberStoryState(remoteKey).seconds===.5,'R4: actual party seconds count once, including another hero\'s raid adventurer');
      rb.C.party[0].dead=true;rb.C.party[1].dead=true;memberStoryTick(.5);check(memberStoryState(localKey).seconds===.5&&memberStoryState(remoteKey).seconds===1,'R4: fallen party members do not gain time together');
      for(const phase of ['town','intown','dead','spirit']){rb.C.phase=phase;memberStoryTick(.5);}memberStoryTick(3600);memberStoryTick(NaN);memberStoryTick(-1);
      check(memberStoryState(remoteKey).seconds===1,'R4: town, death, offline-sized and invalid ticks give no shared time');
      rb.C.phase='seek';SCN.play([['Test','Pause']],null);memberStoryTick(.5);SCN.skip();check(memberStoryState(remoteKey).seconds===1,'R4: conversation time does not count as adventuring');
      rb.C.phase='seek';rb.C.t=1000;const stepped=memberStoryState(remoteKey).seconds;rb.step(.1);check(Math.abs(memberStoryState(remoteKey).seconds-stepped-.1)<1e-7,'R4: real combat step advances present party time');
      Object.defineProperty(document,'hidden',{value:true,configurable:true});try{memberStoryTick(.5);}finally{delete document.hidden;}check(Math.abs(memberStoryState(remoteKey).seconds-stepped-.1)<1e-7,'R4: hidden browser tabs give no story time');
      const beforeSeconds=memberStoryState(remoteKey).seconds;offline(3600,false);supplyTick();check(memberStoryState(remoteKey).seconds===beforeSeconds,'R4: offline gains and jobs never unlock personal stories');
      rb.C.phase='intown';rb.C.party=[];rb.S.guild.stories[localKey]={seconds:1800,done:0,choice:null};rb.S.guild.members[localKey].mood=80;local.aff=40;
      storyHero.mode='auto';check(/Focus/.test(memberStoryProblem(localKey))&&!playMemberStory(localKey,false),'R4: Auto cannot open or choose a new story');storyHero.mode='focus';
      rb.S.guild.jobs[localKey]={job:'mine',since:Date.now(),paid:0};check(/job/.test(memberStoryProblem(localKey)),'R4: working member must return before meeting');delete rb.S.guild.jobs[localKey];
      memberStoryState(remoteKey).seconds=1800;rb.S.guild.members[remoteKey].mood=80;remote.aff=40;storyAlt.party=[remote.id];storyAlt.dun={raid:true};check(/raid/.test(memberStoryProblem(remoteKey)),'R4: saved raid reservation never silently releases a member');storyAlt.party=[];storyAlt.dun=null;
      rb.C.phase='seek';check(/guild hall/i.test(memberStoryProblem(localKey)),'R4: meet in the actual guild hall, not mid-fight');rb.C.phase='intown';TOWN.inside=false;check(/guild hall/i.test(memberStoryProblem(localKey))&&!playMemberStory(localKey,false)&&!openMemberStoryBook(),'R4: outside-town menus cannot start a personal conversation');TOWN.inside=true;
      playMemberStory(localKey,false);const callback=RTALK.done;rb.S.cur=storyAlt.id;SCN.skip();SCN.choose(0);check(memberStoryState(localKey).done===0,'R4: switching heroes during a scene prevents a stale response');rb.S.cur=storyHero.id;
      playMemberStory(localKey,false);const departed=RTALK.done;dismissMember(localKey);check(!RTALK,'R4: leaving the guild closes a pending story');departed(0);check(memberStoryState(localKey).done===0,'R4: dismissed member cannot finish a pending scene');addMember(local,storyHero,true);rb.S.guild.members[localKey].mood=80;
      check(finishMemberStory(localKey,0,0),'R4: returning member can continue their pending arc');
      playMemberStory(localKey,false);const rebooted=RTALK.done;rb.boot();check(!RTALK,'R4: boot clears an interrupted story without choosing');rebooted(1);check(memberStoryState(localKey).done===1,'R4: interrupted story remains unchosen');rb.C.phase='intown';
      const durable=JSON.stringify(memberStoryState(localKey));dismissMember(localKey);check(memberStoryRecordsHTML().includes(local.name),'R4: Guild tab retains already-heard memories after a member leaves');addMember(local,storyHero,true);check(JSON.stringify(memberStoryState(localKey))===durable,'R4: dismissal and rejoining preserve time and story progress');
      rb.S.guild.members[localKey].mood=80;check(!finishMemberStory(localKey,0,0),'R4: rejoining never repeats an earned beat');
      const economy=JSON.stringify({bank:rb.S.bank,money:storyHero.money,xp:storyHero.xp,guildxp:rb.S.guild.xp});finishMemberStory(localKey,1,1);finishMemberStory(localKey,2,0);
      check(JSON.stringify({bank:rb.S.bank,money:storyHero.money,xp:storyHero.xp,guildxp:rb.S.guild.xp})===economy,'R4: narrative choices grant no currency, equipment or guild XP');
      check(memberRequest(localKey)&&!rb.S.guild.requests[localKey]&&guildHTML().includes('Members asking a favor'),'R4: supply favors remain available alongside personal stories');
      rb.save();const reloaded=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1')));check(JSON.stringify(reloaded.guild.stories)===JSON.stringify(rb.S.guild.stories),'R4: all independent account memories survive save/load');
      const legacy=JSON.parse(JSON.stringify(rb.S));delete legacy.guild.stories;const original=JSON.stringify(legacy.chars);const migrated=rb.migrate(legacy);check(Object.keys(migrated.guild.stories).length===0&&JSON.stringify(migrated.chars)===original,'R4: older guild save gets empty stories without rewriting characters');
      const repaired=normalizeMemberStories({bad:{done:3},[localKey]:{seconds:Infinity,done:3,choice:null},[remoteKey]:{seconds:-1,done:99,choice:1}});
      check(!repaired.bad&&repaired[localKey].seconds===0&&repaired[localKey].done===1&&repaired[remoteKey].seconds===0&&repaired[remoteKey].done===3,'R4: malformed optional story records clamp safely without inventing an outcome');
      rb.S.tab='supplies';const cacheBefore=TABS.supplies.key();rb.S.guild.stories[localKey]={seconds:1800,done:0,choice:null};check(TABS.supplies.key()!==cacheBefore,'R4: story readiness and choices invalidate the Guild tab cache');
      check(guildHTML().includes('Stories remembered')&&!guildHTML().includes('memberstorybook')&&!guildHTML().includes('data-act="memberstory"')&&!guildHTML().includes(MEMBER_STORIES[local.name][0]),'R4: Guild tab contains completed records only, with no future story or conversation button');
      TOWN.inside=true;check(openMemberStoryBook()&&modalKind==='memberstories'&&document.querySelector('#sheet').textContent.includes('The Hearth Book'),'R4: story index is a book opened over the world');
      const bookRun=rb.C.run;rb.step(.1);check(rb.C.run===bookRun,'R4: reading the book pauses the world');
      check(playMemberStory(localKey,false)&&!modalKind,'R4: listening closes the book so it cannot hide the portrait');SCN.skip();SCN.choose(1);check(modalKind==='memberstories'&&!RTALK,'R4: deferring returns to the book without choosing');closeModal();
      const registrarWidth=PW;PW=1000;townTalk({id:'registrar',name:'Registrar Mott',lines:()=>[['Registrar Mott','Welcome to the hearth.']]});SCN.skip();SCN.choose(1);check(modalKind==='memberstories','R4: the walkable registrar lends the book');closeModal();PW=registrarWidth;
      rb.S.guild.members[localKey].mood=80;memberTalk(localKey);check(RTALK&&RTALK.memberStory,'R4: walkable hall member opens a ready personal story');SCN.skip();SCN.choose(1);

      // R4 follow-up: stakes, old decisions and an immediate, one-time repair in the world.
      check(Object.keys(MEMBER_STORY_STAKES).length===10,'R4 choices: ten of 32 arcs have consequences, across both factions');
      for(const name of Object.keys(MEMBER_STORY_STAKES)) {
        const {n,owner}=allStoryNpcs.find(x=>x.n.name===name),key=memberKey(owner.id,n.id),w=workerOf(key),stakes=MEMBER_STORY_STAKES[name];
        const prepare=()=>{clearMemberStory();closeModal();storyHero.mode='focus';rb.C.phase='intown';TOWN.inside=true;rb.S.guild.stories[key]={seconds:900,done:1,choice:null};w.m.mood=70;n.aff=40;};
        prepare();
        const legacyChoice=stakes.hurt,old={seconds:1800,done:3,choice:legacyChoice},normalized=normalizeMemberStories({[key]:old})[key];
        check(!normalized.reaction&&!normalized.repaired&&memberStoryScript(name,normalized)[5+legacyChoice]===MEMBER_STORIES[name][5+legacyChoice],name+': completed legacy story keeps its original kind ending');
        const earlier=normalizeMemberStories({[key]:{seconds:900,done:2,choice:legacyChoice}})[key];
        check(!earlier.reaction&&memberStoryScript(name,earlier)[2]===MEMBER_STORIES[name][2],name+': legacy decision awaiting aftermath is not rewritten or punished');
        check(playMemberStory(key,false)&&RTALK.lines.some(l=>l[1]===stakes.dilemma)&&RTALK.lines.some(l=>/This one matters to them/.test(l[1])),name+': the portrait warns in plain words that this choice matters');
        const accountBefore=JSON.stringify({bank:rb.S.bank,money:storyHero.money,xp:storyHero.xp,guildxp:rb.S.guild.xp});
        SCN.skip();SCN.choose(stakes.hurt);const state=memberStoryState(key);
        check(state.reaction==='hurt'&&!state.repaired&&w.m.mood===62&&n.aff===40&&G().members[key]===w.m,name+': hurt costs eight mood, no friendship reward, no departure');
        check(RTALK.memberStory&&RTALK.lines.some(l=>l[1]===stakes.hurtLine)&&RTALK.lines.some(l=>/make amends/i.test(l[1])),name+': immediate world response explains the harm and way back');
        const choiceCache=memberStoriesKey();rb.save();const reload=rb.migrate(JSON.parse(localStorage.getItem('realmbound-save-v1'))).guild.stories[key];
        check(reload.reaction==='hurt'&&reload.choice===stakes.hurt&&!reload.repaired,name+': reload retains unresolved consequence and chosen branch');
        SCN.skip();SCN.choose(1);check(!RTALK&&!state.repaired,name+': closing the response never makes amends automatically');
        w.m.mood=12;n.aff=0;state.seconds=0;
        check(playMemberStoryRepair(key,false),name+': repair has no mood, friendship or party-time gate');
        SCN.skip();SCN.choose(1);check(!state.repaired&&w.m.mood===12,name+': deferring repair has no cost, reward or deadline');
        memberTalk(key);check(RTALK&&RTALK.memberStory&&RTALK.lines.some(l=>l[1]===stakes.repair),name+': walking up to hurt member starts their repair conversation');
        const pendingRepair=RTALK.done;SCN.skip();SCN.choose(0);
        check(state.repaired&&state.reaction==='hurt'&&state.choice===stakes.hurt&&w.m.mood===20&&n.aff===0,name+': amends restore eight mood without erasing the choice or farming affinity');
        check(RTALK&&RTALK.lines.some(l=>l[1]===stakes.after),name+': reconciliation is spoken by the member in the game window');SCN.skip();SCN.choose(0);
        pendingRepair(0);check(w.m.mood===20&&!repairMemberStory(key)&&!playMemberStoryRepair(key,false),name+': stale callback and repeated repair cannot farm mood');
        check(memberStoriesKey()!==choiceCache&&memberStoryRecordsHTML().includes(stakes.after)&&memberStoryRecordsHTML().includes(memberStoryScript(name,state)[3+stakes.hurt])&&!memberStoryRecordsHTML().includes('data-act='),name+': record keeps choice and repair, no story controls in Guild tab');
        check(JSON.stringify({bank:rb.S.bank,money:storyHero.money,xp:storyHero.xp,guildxp:rb.S.guild.xp})===accountBefore,name+': apology spends no money or supplies and grants no economy reward');
        const repairedLoad=normalizeMemberStories({[key]:state})[key];check(repairedLoad.repaired&&repairedLoad.reaction==='hurt',name+': resolved trust survives migration');
        prepare();finishMemberStory(key,1,1-stakes.hurt);check(memberStoryState(key).reaction==='trusted'&&w.m.mood===72&&n.aff===42&&!playMemberStoryRepair(key,false),name+': other decision preserves trust and ordinary relationship reward');
        prepare();finishMemberStory(key,1,stakes.hurt);storyHero.mode='auto';check(!repairMemberStory(key)&&!playMemberStoryRepair(key,false),name+': Auto never chooses reconciliation');storyHero.mode='focus';
        TOWN.inside=false;check(!repairMemberStory(key)&&!playMemberStoryRepair(key,false),name+': repair must be a meeting in the guild hall');TOWN.inside=true;
        playMemberStoryRepair(key,false);const changedHero=RTALK.done;rb.S.cur=storyAlt.id;SCN.skip();SCN.choose(0);check(!memberStoryState(key).repaired,name+': changing listener prevents stale repair');rb.S.cur=storyHero.id;
        playMemberStoryRepair(key,false);const changedAccount=RTALK.done,oldAccount=rb.S;S=Object.assign({},oldAccount);SCN.skip();SCN.choose(0);check(!memberStoryState(key).repaired,name+': changing account prevents stale repair');S=oldAccount;
        playMemberStoryRepair(key,false);const departedRepair=RTALK.done;dismissMember(key);departedRepair(0);check(!RTALK&&!memberStoryState(key).repaired,name+': dismissal clears pending repair without applying it');addMember(n,owner,true);w.m=G().members[key];w.m.mood=60;
        check(repairMemberStory(key)&&memberStoryState(key).repaired,name+': rejoining does not lose the chance to make amends');
      }
      const invalidReaction=normalizeMemberStories({[localKey]:{seconds:0,done:1,choice:null,reaction:'hurt',repaired:true},[remoteKey]:{seconds:1800,done:3,choice:1,reaction:'trusted',repaired:true}});
      check(!invalidReaction[localKey].reaction&&!invalidReaction[localKey].repaired&&!invalidReaction[remoteKey].repaired,'R4 choices: malformed unresolved and trusted records cannot invent reconciliation');
      }

      // R6: exercise rendered-town behavior too (the runner's collapsed iframe has PW=0).
      {const keepChars=S.chars,keepCur=S.cur,keepWidth=PW,keepGuild=S.guild,keepBank=S.bank;
        const hero=newHero('Hub Walker','concord','human','warrior');hero.lvl=60;hero.onboarding=null;hero.mode='focus';S.chars=[hero];S.cur=hero.id;PW=1000;
        const layouts=new Set();
        try {
          for(const zone of Object.keys(HUB_LAYOUTS))for(const faction of ['concord','wild']){
            hero.zone=zone;hero.faction=faction;boot();C.phase='intown';C.lastInput=C.run;townEnter();closeModal();
            const map=TOWN.map,tag=zone+'/'+faction;layouts.add(map.rows.join(''));
            check(map.rows.length===16&&map.rows.every(r=>r.length===28),tag+': regional hub is rectangular');
            const obstacles=townPeople().flatMap(n=>[n.at,...(n.mule?[n.mule]:[])]);
            for(const [id,at] of Object.entries(map.people))check(map.rows[at[1]][at[0]]!=='#'&&!TOWN_TILES[map.rows[at[1]][at[0]]]?.solid,tag+': '+id+' stands on walkable ground');
            for(const b of townBuildings()){
              TOWN_WALK.place(...map.start);check(TOWN_WALK.walkTo(b.door,b.y+b.h-1),tag+': reachable '+b.kind+' with people and mule present');
            }
            for(const n of townPeople()) {TOWN_WALK.place(...map.start);check(TOWN_WALK.walkTo(...n.at),tag+': reachable conversation with '+n.id);}
            const smith=townBuildings().find(b=>b.kind==='smith');hero.bags.push(genJunk(60,'beast'));hero.gear.weapon.dur=30;hero.money=100000;
            TOWN_WALK.place(smith.door,smith.y+smith.h,'up');TOWN_WALK.interact();
            check(TOWN.inside==='smith'&&hero.gear.weapon.dur===30&&hero.bags.some(i=>i.junk),tag+': entering Smithy performs no transaction');
            const keeper=townPeople()[0];check(TOWN_WALK.walkTo(...keeper.at),tag+': Smith is reachable inside');
            TOWN_WALK.place(7,4,'up');TOWN_WALK.interact();check(RTALK?.townService,tag+': walking to Smith opens portrait choices');
            const before=JSON.stringify([hero.money,hero.bags,hero.gear,S.bank]),run=C.run;step(.5);
            check(C.run===run,tag+': world pauses during service conversation');SCN.skip();SCN.choose(3);
            check(JSON.stringify([hero.money,hero.bags,hero.gear,S.bank])===before,tag+': declining changes no equipment or supplies');
            townTalk(keeper);const stale=RTALK.done;SCN.skip();SCN.choose(2);
            check(!hero.bags.some(i=>i.junk)&&hero.gear.weapon.dur===100,tag+': Smith buys scraps and repairs existing equipment');
            const paid=hero.money;hero.gear.weapon.dur=50;stale(2);check(hero.money===paid&&hero.gear.weapon.dur===50,tag+': completed service callback cannot charge twice');
            townExit();check(TOWN.inside===false&&TOWN.pos.x===smith.door&&TOWN.pos.y===smith.y+smith.h,tag+': room exits at its regional door');
            const inn=townBuildings().find(b=>b.kind==='inn');C.hp=1;townDoor(inn);check(TOWN.inside==='inn'&&C.hp===1,tag+': Inn waits for deliberate rest');
            check(!openMemberStoryBook(),tag+': Inn cannot open Guild Hall stories');townTalk(townPeople()[0]);SCN.skip();SCN.choose(0);check(C.hp===ST.hpMax,tag+': Keeper restores health');
            C.hp=1;townTalk(townPeople()[0]);const abandoned=RTALK.done;boot();const afterBoot=C.hp;abandoned(0);check(!RTALK&&C.hp===afterBoot,tag+': reloading clears and invalidates pending service');
            C.phase='intown';hero.mode='auto';hero.bags.push(genJunk(60,'beast'));townEnter();
            for(let i=0;i<2000&&C.phase==='intown';i++){townAutoTick();TOWN_WALK.tick(.05);}
            check(C.phase==='seek'&&!hero.bags.some(i=>i.junk)&&!RTALK,tag+': Auto sells, repairs and finds regional road exit');hero.mode='focus';
          }
          check(layouts.size>=8,'R6: all eight regions have distinct footprints');
          hero.zone='fens';boot();C.phase='intown';townEnter();check(TOWN.map.rows.join('').includes('~')&&TOWN.map.rows.join('').includes('_'),'R6: Fenwatch has water and boardwalk');
          hero.zone='frostmere';townEnter();check(TOWN.map.rows.join('').includes('s'),'R6: Lanternrest has snow around its lodge');
        }finally{clearTownService();PW=keepWidth;S.chars=keepChars;S.cur=keepCur;S.guild=keepGuild;S.bank=keepBank;TOWN.inside=false;TOWN.on=false;if(H())boot();}
      }

      // R5: every class/slot, guarded shared-bank transactions, and the actual Smith conversation.
      {const keepChars=S.chars,keepCur=S.cur,keepGuild=S.guild,keepBank=S.bank,keepWidth=PW;
        const hero=newHero('Guild Crafter','concord','human','warrior'),alt=newHero('Other Purse','wild','grishar','hunter');hero.onboarding=null;alt.onboarding=null;hero.lvl=55;hero.zone='crownheart';hero.mode='focus';S.chars=[hero,alt];S.cur=hero.id;PW=1000;
        S.guild={founded:1,name:'The Shared Anvil',level:1,xp:0,members:{},jobs:{},requests:{},stories:{}};
        const ready=()=>{clearTownService();boot();C.phase='intown';C.lastInput=C.run;TOWN.inside='smith';hero.money=1000000;hero.bags=[];S.bank={ore:500,herb:500,kit:3,potion:4};};
        const ledger=()=>JSON.stringify([S.bank,hero.money,hero.bags,hero.gear,alt.money,alt.bags,S.guild.xp]);
        try{
          for(const cls of Object.keys(CLASSES))for(const slot of SLOTS){hero.cls=cls;ready();const cost=guildGearCost(slot),before=ledger(),a=guildGearItem(cls,slot),b=guildGearItem(cls,slot);delete a.id;delete b.id;
            check(JSON.stringify(a)===JSON.stringify(b),cls+'/'+slot+': preview is deterministic');check(ledger()===before,cls+'/'+slot+': preview spends nothing');
            const oldGear=JSON.stringify(hero.gear),other=JSON.stringify([alt.money,alt.bags]),made=craftGuildGear(slot);
            check(made&&made.rar===3&&made.ilvl===55&&made.crafted&&!made.set&&canEquip(made),cls+'/'+slot+': usable level-55 rare, no raid set');
            check(hero.money===1000000-cost.money&&S.bank.ore===500-cost.ore&&S.bank.herb===500-cost.herb&&S.bank.kit===3&&S.bank.potion===4,cls+'/'+slot+': exactly one fee and guild supply debit');
            check(JSON.stringify(hero.gear)===oldGear&&hero.bags.length===1&&hero.bags[0]===made,cls+'/'+slot+': item stays in bags until equipped');
            check(JSON.stringify([alt.money,alt.bags])===other&&S.guild.xp===0,cls+'/'+slot+': no other hero or guild XP mutation');
            const loaded=migrate(JSON.parse(localStorage.getItem(KEY))),saved=loaded.chars.find(c=>c.id===hero.id).bags[0];check(saved.crafted&&saved.name===made.name&&JSON.stringify(saved.stats)===JSON.stringify(made.stats),cls+'/'+slot+': crafted item survives save migration');
            const paid=hero.money;sellItem(made.id);check(hero.money-paid===made.value&&made.value<cost.money,cls+'/'+slot+': selling cannot turn crafting into free money');
          }
          hero.cls='warrior';ready();hero.lvl=54;let before=ledger();check(!craftGuildGear('chest')&&ledger()===before,'R5: level-54 request cannot debit stores');hero.lvl=55;
          const cases=[['guild',()=>S.guild.founded=0,()=>S.guild.founded=1],['road',()=>C.phase='seek',()=>C.phase='intown'],['Inn',()=>TOWN.inside='inn',()=>TOWN.inside='smith'],['raid',()=>hero.dun={raid:true},()=>hero.dun=null],['Auto',()=>hero.mode='auto',()=>hero.mode='focus'],['ore',()=>S.bank.ore=0,()=>S.bank.ore=500],['herbs',()=>S.bank.herb=0,()=>S.bank.herb=500],['money',()=>hero.money=0,()=>hero.money=1000000],['full bags',()=>hero.bags=Array.from({length:16},()=>genJunk(55,'beast')),()=>hero.bags=[]]];
          for(const [label,change,undo]of cases){change();before=ledger();check(!!guildGearProblem('chest')&&!craftGuildGear('chest')&&ledger()===before,'R5: '+label+' refusal has no partial debit');undo();}
          before=ledger();check(!craftGuildGear('unknown')&&ledger()===before,'R5: invalid pattern is rejected');
          const keeper=townPeople()[0];talkTownService(keeper);SCN.skip();SCN.choose(4);check(RTALK?.townService&&RTALK.choices.includes('Weapon'),'R5: Smith offers patterns inside the world');SCN.skip();SCN.choose(0);
          check(SCN.el.querySelector('.guild-craft-preview')?.textContent.includes('Cost:')&&RTALK.choices.includes('Commission this piece'),'R5: full cost and preview precede confirmation');before=ledger();SCN.skip();SCN.choose(1);check(ledger()===before&&!SCN.el.querySelector('.guild-craft-preview'),'R5: declining preview spends nothing');
          SCN.skip();SCN.choose(0);const duplicate=RTALK.done;SCN.skip();SCN.choose(0);check(hero.bags.length===1&&RTALK.lines[0][1].includes('pack'),'R5: deliberate confirmation creates one item and Smith responds');const after=ledger();duplicate(0);check(ledger()===after,'R5: repeated callback cannot create or debit twice');clearTownService();
          hero.money=0;previewGuildGear(keeper,'weapon',0);check(!RTALK.choices.includes('Commission this piece')&&SCN.el.querySelector('.guild-craft-preview').textContent.includes('fee'),'R5: unavailable commission shows reason and no purchase button');clearTownService();hero.money=1000000;
          previewGuildGear(keeper,'weapon',0);const stale=RTALK.done;boot();before=ledger();stale(0);check(ledger()===before&&!RTALK&&!SCN.el.querySelector('.guild-craft-preview'),'R5: boot cancels preview and pending transaction');
          C.phase='intown';TOWN.inside='smith';previewGuildGear(keeper,'weapon',0);S.cur=alt.id;before=ledger();SCN.skip();SCN.choose(0);check(ledger()===before,'R5: hero switch cannot spend another purse');S.cur=hero.id;
          previewGuildGear(keeper,'weapon',0);const oldAccount=S;S=Object.assign({},S);before=ledger();SCN.skip();SCN.choose(0);check(ledger()===before,'R5: replaced account cannot use stale confirmation');S=oldAccount;
          previewGuildGear(keeper,'weapon',0);hero.mode='auto';before=ledger();SCN.skip();SCN.choose(0);check(ledger()===before&&!openGuildGear(keeper),'R5: Auto never confirms or opens crafting');hero.mode='focus';
          previewGuildGear(keeper,'weapon',0);S.bank.ore=0;before=ledger();SCN.skip();SCN.choose(0);check(ledger()===before&&RTALK.choices.length===1,'R5: supplies are rechecked when confirming');clearTownService();
          const legacy=migrate({chars:[Object.assign({},hero,{bags:[],onboarding:null})],cur:hero.id});const activeAccount=S;S=legacy;boot();check(!H().bags.length&&bank().ore===0,'R5: pre-crafting save boots without a new mandatory field');S=activeAccount;
        }finally{clearTownService();S.chars=keepChars;S.cur=keepCur;S.guild=keepGuild;S.bank=keepBank;PW=keepWidth;TOWN.inside=false;TOWN.on=false;if(H())boot();}
      }
      rb.save();
      if(typeof openRealmNotebook==='function'){
        const hero=newHero('Bookkeeper','concord','human','warrior');hero.onboarding={arrival:true,hints:{}};S.chars=[hero];S.cur=hero.id;boot();C.phase='seek';C.t=20;
        check(!realmNotebookOpen()&&document.querySelector('.menu').hidden,'T38: fresh or legacy boot leaves paperwork put away');
        const before=JSON.stringify({hero,Skeys:Object.keys(S)});check(openRealmNotebook('quests'),'T38: Quest Journal opens over the scene');
        const timers=JSON.stringify({run:C.run,t:C.t,hp:C.hp,cds:C.cds});step(1);check(JSON.stringify({run:C.run,t:C.t,hp:C.hp,cds:C.cds})===timers,'T38: reading preserves health and world/combat clocks');
        hero.mode='auto';step(2);check(JSON.stringify({run:C.run,t:C.t,hp:C.hp,cds:C.cds})===timers,'T38: Auto also waits while the notebook is open');hero.mode='focus';
        check(document.querySelector('.world').inert&&document.querySelector('.menu').getAttribute('aria-modal')==='true','T38: notebook owns input and announces a dialog');
        closeRealmNotebook(false);check(!realmNotebookOpen()&&!document.querySelector('.world').inert,'T38: putting away restores world input');
        check(before===JSON.stringify({hero,Skeys:Object.keys(S)}),'T38: opening and closing adds no save fields or hero changes');
        check(!openRealmNotebook('not-a-page')&&!openRealmNotebook('pets'),'T38: invalid pages and warrior pet notes cannot open');
        for(const key of ['quests','bags','char','friends','mounts','talents','addons','supplies','journal','map','road','log']){check(openRealmNotebook(key),'T38: existing feature reachable in '+key);closeRealmNotebook(false);}
        openRealmNotebook('bags');boot();check(!realmNotebookOpen()&&document.querySelector('.menu').hidden,'T38: character boot/import clears transient open book');
        openRealmNotebook('quests');const alt=newHero('Second','wild','grishar','hunter');alt.onboarding={arrival:true,hints:{}};S.chars.push(alt);S.cur=alt.id;syncRealmNotebook();check(!realmNotebookOpen()&&!document.querySelector('.world').inert,'T38: hero switch cannot retain another hero notebook');
        boot();check(openRealmNotebook('pets'),'T38: Hunter companion notes remain reachable');closeRealmNotebook(false);
        openModal('chars',charsHTML());check(!openRealmNotebook('bags'),'T38: existing character dialogs take priority');closeModal();
        const q=QUESTS[alt.zone][0];questOffer(q.id);check(!openRealmNotebook('quests'),'T38: portrait conversations take priority over paperwork');RTALK=null;SCN.el.hidden=true;
        closeRealmNotebook(false);
      }

      // T41: physical rooms, transaction ownership, journal routes and transient state.
      {const keep=S,keepWidth=PW;S=emptyS();PW=1000;
       const hero=newHero('Place Walker','concord','human','hunter'),alt=newHero('Resting Friend','wild','grishar','warrior');
       hero.onboarding={arrival:true,hints:{}};alt.onboarding={arrival:true,hints:{}};hero.lvl=40;hero.mode='focus';hero.money=1000000;S.chars=[hero,alt];S.cur=hero.id;boot();C.phase='intown';townEnter();
       const ready=()=>{closeRealmNotebook(false);clearTownService();closeModal();hero.mode='focus';C.phase='intown';C.lastInput=C.run;townEnter();TOWN.on=true;};
       const choose=i=>{SCN.skip();SCN.choose(i);};
       const click=selector=>{const b=document.querySelector('[data-field-page="place"] '+selector);check(!!b&&!b.disabled,'T41: available '+selector);b.click();};
       try{
        for(const faction of ['concord','wild'])for(const zone of Object.keys(HUB_LAYOUTS)){
         hero.faction=faction;hero.zone=zone;ready();const people=townPeople();
         check([...new Set(QUESTS[zone].map(giver))].every(name=>people.some(n=>n.id==='giver'&&n.name===name)),'T41: every '+zone+'/'+faction+' giver exists in town');
         check(new Set(people.map(n=>n.at.join(','))).size===people.length,'T41: '+zone+'/'+faction+' people keep separate footprints');
         for(const room of ['trainer','stable']){const b=townBuildings().find(b=>b.kind===room);TOWN_WALK.place(...TOWN.map.start);check(TOWN_WALK.walkTo(b.door,b.y+b.h-1),'T41: reachable '+zone+'/'+faction+'/'+room);townDoor(b);check(TOWN.inside===room&&townPeople()[0].id==='keeper','T41: entering '+room+' opens a walkable room');check(TOWN_WALK.walkTo(...townPeople()[0].at),'T41: '+room+' Keeper has an approach');TOWN_WALK.place(7,4,'up');check(TOWN_WALK.interact()&&RTALK?.lines[0][0]===(room==='trainer'?'Trainer Saren':'Stable Keeper Vella'),'T41: real walk-up dispatch reaches '+room+' Keeper');choose(RTALK.choices.length-1);townExit();check(TOWN.pos.x===b.door&&TOWN.pos.y===b.y+b.h,'T41: '+room+' exits at the right regional door');}
        }
        hero.faction='concord';hero.zone='thornvale';ready();const trainer=townBuildings().find(b=>b.kind==='trainer');townDoor(trainer);const n=townPeople()[0],ledger=JSON.stringify([hero.money,hero.talents]);
        townTalk(n);choose(1);check(JSON.stringify([hero.money,hero.talents])===ledger&&!PLACE_BOOK,'T41: declining Trainer changes nothing');
        townTalk(n);choose(0);check(PLACE_BOOK?.room==='trainer'&&FIELD_BOOK==='place'&&$('.menu .tabs').hidden,'T41: Trainer lends a place-bound Lesson Book');
        const clocks=JSON.stringify([C.run,C.t,C.hp]);step(1);check(clocks===JSON.stringify([C.run,C.t,C.hp]),'T41: lesson book pauses world clocks');
        const talent=TALENT_LIST[hero.cls].find(t=>!t.req),points=talentPoints();click('[data-act="talent"][data-arg="'+talent.id+'"]');check(hero.talents[talent.id]===1&&talentPoints()===points-1,'T41: actual Learn click spends one real point');
        closeRealmNotebook(false);townTalk(n);const stale=RTALK.done;boot();stale(0);check(!PLACE_BOOK&&!RTALK,'T41: boot cancels a pending Trainer callback');
        ready();townDoor(trainer);townTalk(townPeople()[0]);const switched=RTALK.done;S.cur=alt.id;switched(0);check(!PLACE_BOOK,'T41: a stale Trainer callback cannot affect another hero');S.cur=hero.id;clearTownService();
        ready();townDoor(townBuildings().find(b=>b.kind==='stable'));const stable=townPeople()[0];townTalk(stable);choose(0);let cash=hero.money;click('[data-act="buyriding"]');check(hero.riding===1&&hero.money===cash-RIDING[1].cost,'T41: riding lesson debits exactly the old price');
        const offer=MOUNT_SHOP[hero.faction].find(m=>m.lvl<=hero.lvl);cash=hero.money;click('[data-act="buymount"][data-arg="'+offer.key+'"]');check(hero.mounts.some(m=>m.key===offer.key)&&hero.money===cash-offer.cost,'T41: Stable sells one mount for its existing price');
        const p={id:uid(),name:'Hearth Boar',species:'Boar',family:'boar',rar:0,col:'#937455',lvl:10,xp:0,bond:0,happy:60,traits:[],hp:1,tamedIn:'Thornvale',tamedAt:10};hero.pets=[p];hero.activePet=p.id;
        closeRealmNotebook(false);townTalk(stable);choose(1);check(PLACE_BOOK?.room==='stable'&&$('#petName'),'T41: Hunters meet their companions at the Stable');
        click('[data-act="petrelease"]');check(hero.pets.length===1,'T41: first release click only asks for confirmation');click('[data-act="petrelease"]');check(!hero.pets.length&&!hero.activePet,'T41: second deliberate release uses existing handler');
        closeRealmNotebook(false);ready();S.guild={jobs:{}};townDoor(townBuildings().find(b=>b.kind==='guild'));check(inGuildHall()&&townPeople().some(n=>n.id==='registrar'),'T41: unclaimed hall remains walkable before level-40 founding');
        TOWN_WALK.place(13,2,'right');TOWN_WALK.interact();check(PLACE_BOOK?.room==='guild'&&$('#fieldBookTitle').textContent.includes('Jobs Board'),'T41: walking to board opens only jobs');click('[data-act="job"][data-arg="'+alt.id+'|mine"]');check(ROSTER.jobOf(alt.id)==='mine','T41: real board delegates to the resting hero');click('[data-act="jobstop"]');check(!ROSTER.jobOf(alt.id),'T41: board can call the worker back');
        closeRealmNotebook(false);S.bank={ore:6,herb:4,kit:0,potion:0};townSign(2,2);click('[data-act="craftkit"]');click('[data-act="craftpot"]');check(S.bank.ore===0&&S.bank.herb===0&&S.bank.kit===1&&S.bank.potion===1,'T41: chest crafting spends only the existing supply quantities');
        closeRealmNotebook(false);hero.npcs.slice(0,4).forEach(n=>{n.met=true;n.aff=AFFINITY[2].at;});const charterCash=hero.money;
        talkPlaceRegistrar(hallPeople()[0]);choose(0);check(PLACE_BOOK?.room==='guild'&&$('#guildName'),'T41: Registrar presents the charter inside the Hall');$('#guildName').value='The Roadmates';click('[data-act="guildfound"]');check(guildOn()&&G().name==='The Roadmates'&&hero.money===charterCash-GUILD_COST,'T41: physical charter preserves chosen name, signatures and exact fee');
        closeRealmNotebook(false);const member=hallPeople().find(n=>n.id==='member');check(!!member,'T41: signing members stand separately by the hearth');talkPlaceMember(member.key);choose(1);check(TOWN_WALK.path.length>0&&!PLACE_BOOK,'T41: member directs work to the physical board');TOWN_WALK.place(13,2,'right');TOWN_WALK.interact();click('[data-act="job"][data-arg="'+member.key+'|mine"]');closeRealmNotebook(false);check(!hallPeople().some(n=>n.key===member.key),'T41: a working member is absent rather than standing on the player');TOWN_WALK.place(13,2,'right');TOWN_WALK.interact();click('[data-act="jobstop"][data-arg="'+member.key+'"]');closeRealmNotebook(false);check(hallPeople().some(n=>n.key===member.key),'T41: calling a member back restores their own hearth spot');
        ready();const q=QUESTS[hero.zone][0];hero.quests.active=[];hero.quests.done={};const giverNpc=townPeople().find(n=>n.name===giver(q));townTalk(giverNpc);choose(0);choose(0);check(hero.quests.active.includes(q.id),'T41: actual giver portrait accepts a request');
        hero.quests.prog[q.id]=q.n;hero.bags=[];cash=hero.money;finishPlaceQuest(q);const rewardCallback=RTALK.done;choose(0);check(hero.quests.done[q.id]&&hero.bags.length===1&&hero.money===cash+qMoney(q),'T41: giver completion pays one old reward');const paid=hero.money;rewardCallback(0);check(hero.money===paid&&hero.bags.length===1,'T41: repeated completion callback cannot pay twice');SCN.skip();
        openRealmNotebook('talents');check(!$('#tabbody [data-act="talent"]')&&$('#tabbody [data-place-record]'),'T41: carried Lesson Notes are records rather than a remote Trainer');closeRealmNotebook(false);
        ready();openRealmNotebook('char');document.querySelector('[data-act="tab"][data-arg="talents"]').click();check(!realmNotebookOpen()&&TOWN_WALK.path.length>0,'T41: Field Kit shortcut walks toward the Trainer instead of opening remote lessons');
        ready();townDoor(trainer);openTrainerLessons(townPeople()[0]);C.phase='seek';renderPlaceBook(false);check(!PLACE_BOOK&&!realmNotebookOpen(),'T41: leaving a place invalidates its open services');
        const legacy=JSON.parse(JSON.stringify(S));check(!Object.keys(legacy).some(k=>/place|field/i.test(k)),'T41: place/room interfaces add no persistent fields');S=migrate(legacy);boot();check(!PLACE_BOOK&&!realmNotebookOpen()&&H().riding===1&&H().mounts.length===1&&H().quests.done[q.id],'T41: legacy save/reload keeps earned riding, mount and quest rewards');
       }finally{closeRealmNotebook(false);clearTownService();S=keep;PW=keepWidth;TOWN.inside=false;TOWN.on=false;if(H())boot();}
      }
      // T43: correspondence is presentation data, never an encounter or pet conversion.
      {
       const keep=S,keepC=C,keepTown=TOWN.on,keepRandom=Math.random;const hero=rb.newHero('Catalogue','concord','human','hunter');
       try{S.chars=[hero];S.cur=hero.id;rb.boot();TOWN.on=false;let zones=0,dungeons=0;
        for(const [zone,def]of Object.entries(ZONES))for(const m of def.mobs){
         const info=catalogueForMob(m,{zone});
         if(m.kind==='beast'){
          zones++;check(!!info,'T43: zone beast mapped '+zone+'/'+m.id);
          check(info.species.family===m.fam,'T43: zone silhouette family retained '+m.id);
          check(info.localName===m.name&&typeof info.observation==='string'&&info.observation.length>15,'T43: local alias and hunter observation retained '+m.id);
         }else check(info===null,'T43: a person is not mapped to an animal '+m.id);
        }
        check(zones===31,'T43: all 31 zone beasts covered');
        for(const [id,def]of Object.entries(DUNGEONS))for(const [step,e]of def.enc.entries()){
         const mob={...e,id:'dun'+step,dun:true,name:e.name},info=catalogueForMob(mob,{dun:{id,step:step+1}});
         if(e.kind==='beast'){
          dungeons++;check(!!info,'T43: dungeon beast mapped '+id+'/'+step);
          check(info.species.family===e.fam,'T43: dungeon silhouette family retained '+id+'/'+step);
          check(info.localName===e.name,'T43: boss/brood title retained '+e.name);
         }else check(info===null,'T43: dungeon person is not an animal '+e.name);
        }
        check(dungeons===17,'T43: all 17 dungeon beasts including named bosses covered');
        const data=JSON.stringify({ZONES,DUNGEONS,QUESTS,FAMILIES,RARITY});
        hero.zone='thornvale';hero.lvl=10;rb.boot();hero.grind='wolf';Math.random=()=>.5;rb.spawn();Math.random=keepRandom;TOWN.on=false;
        const before=JSON.stringify(C.mob),info=catalogueForMob(C.mob);const xp=killXP(C.mob);updateWorld();updateWorld();
        check(!!info&&info.species.name==='Flintpup','T43: actual spawned wolf resolves its shared species');
        check(before===JSON.stringify(C.mob)&&xp===killXP(C.mob),'T43: showing a name changes no combat runtime field');
        check(!$('#catalogueSighting').hidden&&$('#catalogueSighting strong').textContent==='Flintpup'&&$('#catalogueSighting span').textContent===info.observation,'T43: species and hunter line are inside the active world');
        check($('#tName').textContent.includes(C.mob.name),'T43: generated local rarity name remains in the target');
        C.mob=null;updateWorld();check($('#catalogueSighting').hidden,'T43: no stale observation after losing the target');
        check(data===JSON.stringify({ZONES,DUNGEONS,QUESTS,FAMILIES,RARITY}),'T43: encounter, quest, pet and rarity definitions are unchanged');
        const pet={id:'old',name:'Moss',species:'Thornback Boar',family:'boar',rar:0,col:'#7a4a2a',lvl:5,xp:0,bond:25,happy:60,traits:[],hp:1};hero.pets=[pet];hero.activePet=pet.id;
        const stats=JSON.stringify(petStats(pet)),saved=JSON.stringify(hero);S=migrate(JSON.parse(JSON.stringify(S)));rb.boot();
        check(JSON.stringify(H().pets[0])===JSON.stringify(pet)&&JSON.stringify(petStats(H().pets[0]))===stats,'T43: old pet name, species and combat stats survive reload');
        check(!saved.includes('catalogue')&&!saved.includes('observation'),'T43: catalogue presentation adds no save fields');
        check(catalogueForMob({id:'wolf',kind:'humanoid'},{zone:'thornvale'})===null&&catalogueForMob({id:'unknown',kind:'beast'},{zone:'thornvale'})===null,'T43: unknown or non-beast targets are not guessed');
        check(catalogueForMob({id:'dun4',dun:true,kind:'beast'},{dun:{id:'raid'}})===null,'T43: raid identities are left to their own future pass');
       }finally{Math.random=keepRandom;S=keep;C=keepC;TOWN.on=keepTown;if(H())rb.boot();}
      }
      // T48: roads are transient physical places; existing transactions and combat remain authoritative.
      {
       const keep=S,keepC=C;const hero=rb.newHero('Roadkeeper','concord','human','warrior');hero.lvl=20;hero.mode='focus';S=migrate(JSON.parse(JSON.stringify(keep)));S.chars=[hero];S.cur=hero.id;
       const ready=()=>{clearRealmRoad();clearTownService();closeRealmNotebook(false);closeModal();boot();clearArrival();TOWN.inside=false;C.phase='seek';C.mob=null;C.t=100;updateWorld();};
       try{
        for(const faction of ['concord','wild'])for(const zone of Object.keys(ZONES)){
         hero.faction=faction;hero.zone=zone;ready();const before=JSON.stringify({money:hero.money,xp:hero.xp,quests:hero.quests,bags:hero.bags});
         check(startRealmRoad()&&realmRoadActive()&&!townActive(),'T48: physical road opens in '+faction+' '+zone);
         check(REALM_ROAD_MAP.rows.every(row=>row.length===28),'T48: road has a rectangular footprint '+zone);
         for(const d of realmRoadDestinations()){REALM_ROAD_WALK.place(1,12,'right');check(REALM_ROAD_WALK.walkTo(...d.at),'T48: connected path to '+d.name+' '+faction+' '+zone);}
         REALM_ROAD_WALK.place(8,7,'up');REALM_ROAD_WALK.step('up');check(REALM_ROAD.inside,'T48: physical inn doorway enters '+zone);
         for(const d of realmRoadDestinations()){REALM_ROAD_WALK.place(...REALM_ROAD_INN.start);check(REALM_ROAD_WALK.walkTo(...d.at),'T48: inn path to '+d.name+' '+zone);}
         exitRealmRoad(6);check(!REALM_ROAD.inside&&REALM_ROAD.pos.x===8&&REALM_ROAD.pos.y===7,'T48: inn door returns to same approach '+zone);
         returnFromRealmRoad();check(before===JSON.stringify({money:hero.money,xp:hero.xp,quests:hero.quests,bags:hero.bags}),'T48: sightseeing earns no currency, quest or item windfall '+zone);
        }
        hero.zone='thornvale';hero.faction='concord';ready();startRealmRoad();const snapshot=JSON.stringify(C);step(30);check(JSON.stringify(C)===snapshot,'T48: road walking cannot spawn or tick combat');REALM_ROAD_WALK.step('right');const beforeWalk=REALM_ROAD_WALK.fx;step(.1);check(REALM_ROAD_WALK.fx>beforeWalk&&REALM_ROAD_WALK.fx<REALM_ROAD.pos.x,'T48: smooth walking advances on the game timer without a rendered frame');REALM_ROAD_WALK.place(1,12,'right');
        openRealmNotebook('bags');const pos=JSON.stringify(REALM_ROAD.pos);REALM_ROAD_WALK.step('right');step(10);check(pos===JSON.stringify(REALM_ROAD.pos)&&JSON.stringify(C)===snapshot,'T48: reading freezes road and combat');closeRealmNotebook(false);
        exitRealmRoad(27);check(!realmRoadActive()&&C.phase==='town'&&C.t===travel(10),'T48: town gate uses normal travel duration');
        ready();C.phase='intown';townEnter();startRealmRoad();exitRealmRoad(0);check(C.phase==='seek'&&C.t===travel(6),'T48: field gate from town uses normal outward travel');
        ready();C.phase='intown';townEnter();startRealmRoad();returnFromRealmRoad();check(C.phase==='intown','T48: putting aside town walk returns to the same town');
        for(const phase of ['fight','loot','dead','town']){ready();C.phase=phase;check(!startRealmRoad(),'T48: cannot interrupt '+phase);}
        ready();hero.dun={id:'sanctum'};check(!startRealmRoad(),'T48: road never shortcuts dungeon');hero.dun=null;hero.mode='auto';check(!startRealmRoad(),'T48: Auto route remains unchanged');hero.mode='focus';ready();
        startRealmRoad();REALM_ROAD_WALK.place(8,7,'up');REALM_ROAD_WALK.step('up');REALM_ROAD_WALK.place(6,4,'up');REALM_ROAD_WALK.interact();
        check(RTALK&&RTALK.roadScene&&RTALK.choices.includes('Buy a potion (2s)'),'T48: keeper speaks in the physical inn');
        let hp=C.hp,timer=C.t;step(20);check(C.hp===hp&&C.t===timer,'T48: dialogue never heals or spends travel time');
        const stale=RTALK.done;hero.money=200;const pots=bank().potion;SCN.choose(1);check(hero.money===0&&bank().potion===pots+1,'T48: potion spends exactly existing two-silver price');stale(1);check(hero.money===0&&bank().potion===pots+1,'T48: duplicate callback cannot buy twice');
        talkRealmRoad(realmRoadPeople()[0]);SCN.choose(1);check(hero.money===0&&bank().potion===pots+1,'T48: insufficient purse grants no potion');
        talkRealmRoad(realmRoadPeople()[0]);C.hp=ST.hpMax*.4;SCN.choose(0);hp=C.hp;step(.1);check(Math.abs(C.hp-hp-ST.hpMax*.07*.1)<.00001&&C.hp<ST.hpMax,'T48: deliberate rest uses existing gradual rate, not instant healing');
        openRealmNotebook('bags');hp=C.hp;step(10);check(C.hp===hp,'T48: notebook pauses even deliberate rest');closeRealmNotebook(false);
        C.hp=ST.hpMax;step(.1);check(C.phase==='seek'&&!REALM_ROAD.rest,'T48: completed rest settles without starting fight');timer=C.t;step(20);check(C.phase==='seek'&&C.t===timer&&!C.mob,'T48: no combat after roadside recovery until walk is put aside');
        talkRealmRoad(realmRoadPeople()[0]);const cancelled=RTALK.done;clearTownService();cancelled(1);check(bank().potion===pots+1,'T48: cancelled conversation cannot spend');
        talkRealmRoad(realmRoadPeople()[0]);const replaced=RTALK.done,money=hero.money;S=JSON.parse(JSON.stringify(S));check(!realmRoadActive(),'T48: account replacement invalidates road');replaced(1);check(H().money===money&&!RTALK,'T48: stale keeper cannot spend replacement purse');
        S=migrate(JSON.parse(JSON.stringify(keep)));C=keepC;if(H())boot();S.chars=[hero];S.cur=hero.id;hero.mode='focus';hero.dun=null;ready();startRealmRoad();hero.zone='fens';check(!realmRoadActive(),'T48: changing region clears approach');
        hero.zone='thornvale';ready();startRealmRoad();hero.mode='auto';check(!realmRoadActive(),'T48: switching Auto clears walking');hero.mode='focus';ready();startRealmRoad();const saved=JSON.stringify(S);check(!saved.includes('REALM_ROAD')&&!saved.includes('roadScene'),'T48: road saves no new runtime fields');S=migrate(JSON.parse(saved));boot();check(!realmRoadActive()&&$('#leaveRoad').hidden,'T48: reload clears transient road');
       }finally{clearRealmRoad();clearTownService();closeRealmNotebook(false);S=keep;C=keepC;if(H())boot();}
      }

      // RB-PLAY1: an idle Focus town visit is still the player's visit, not combat fallback's errand.
      {const keep=S,keepC=C,width=PW;try{S=JSON.parse(JSON.stringify(S));const hero=newHero('First Road','concord','human','warrior');hero.onboarding=null;hero.mode='focus';hero.stats.kills=1;S.chars=[hero];S.cur=hero.id;PW=1000;boot();closeModal();closeRealmNotebook(false);C.run=100;C.lastInput=0;C.phase='intown';C.townT=.01;hero.money=1000;hero.gear.weapon.dur=40;townEnter();const money=hero.money,dur=hero.gear.weapon.dur;check(aiOn()&&!townAuto(),'RB-PLAY1: combat fallback does not delegate a Focus town visit');step(40);townAutoTick();check(C.phase==='intown'&&!TOWN.auto&&hero.money===money&&hero.gear.weapon.dur===dur,'RB-PLAY1: idle Focus does not buy repairs, choose a route or leave town');updateWorld();check($('#modeHint').textContent.includes('Take your time in town')&&!$('#status').textContent.includes('Smithy'),'RB-PLAY1: idle Focus town explains manual walking and talking');
       const inn=townBuildings().find(b=>b.kind==='inn');C.hp=1;townDoor(inn);check(TOWN.inside==='inn'&&C.hp===1,'RB-PLAY1: idle Focus still enters the Inn without auto-healing');townTalk(townPeople()[0]);SCN.skip();SCN.choose(0);check(C.hp===ST.hpMax,'RB-PLAY1: the Keeper heals when deliberately asked');townExit();
       hero.mode='auto';townEnter();check(townAuto()&&TOWN.auto==='smith','RB-PLAY1: explicit Auto still delegates the town route');C.townT=.01;step(.1);check(C.phase==='seek','RB-PLAY1: explicit Auto still repairs and leaves');hero.mode='focus';C.phase='intown';TOWN.auto='smith';TOWN_WALK.path=[[1,1]];townAutoTick();check(!TOWN.auto&&!TOWN_WALK.path.length,'RB-PLAY1: switching Focus cancels only the automatic town route');
       C.phase='fight';openRealmNotebook('map');check($('#fieldGoTown').disabled&&$('#fieldTownReason').textContent.includes('finish this fight'),'RB-PLAY1: Map visibly explains combat travel restriction');closeRealmNotebook(false);C.phase='seek';openRealmNotebook('map');check(!$('#fieldGoTown').disabled&&$('#fieldTownReason').hidden,'RB-PLAY1: safe travel becomes available without a new rule');closeRealmNotebook(false);hero.dun={id:'vault',tier:0,step:0,mods:[],wipes:0};syncFieldTownButton();check($('#fieldGoTown').disabled&&$('#fieldTownReason').textContent.includes('dungeon'),'RB-PLAY1: Map explains dungeon travel restriction');hero.dun=null;
       const q=QUESTS[hero.zone][0];hero.quests.active=[q.id];hero.quests.prog[q.id]=q.n;hero.quests.done={};updateWorld();check(!document.getElementById('fieldQuestReady').hidden,'RB-PLAY1: a ready request is visible on the carried Journal while the book is put away');openRealmNotebook('quests');const rewards=JSON.stringify(qReward(q)),coins=hero.money;findPlaceQuest(q.id);check(FIELD_BOOK==='map'&&realmNotebookOpen()&&hero.money===coins&&!hero.quests.done[q.id]&&JSON.stringify(qReward(q))===rewards,'RB-PLAY1: meeting a ready giver opens the Map without choosing or granting rewards');closeRealmNotebook(false);
      }finally{clearTownService();closeRealmNotebook(false);clearArrival();S=keep;C=keepC;PW=width;if(H())boot();}}
return checks;
};
