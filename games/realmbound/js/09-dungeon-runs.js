'use strict';
Object.assign(SANCTUM,{zone:'fens',sky:['#0b1d26','#1b3d45'],hill:'#14303a',ground:'#2a3c36',waveName:'Crashing Wave',surgeName:'Tidal Surge'});
const dungeonDef=(id)=>{const k=id||(H().dun&&H().dun.id)||'sanctum';return DUNGEONS[k]||RAIDS[k]||SANCTUM;};
function dungeonStats(id){const h=H();h.drecords=h.drecords||{};return h.drecords[id]||(h.drecords[id]={clears:0,best:-1,runs:0});}
function migrateDungeons(h){
  h.dstats=h.dstats||{clears:0,best:-1,runs:0};h.drecords=h.drecords||{};
  if(!h.drecords.sanctum)h.drecords.sanctum={...h.dstats};
  if(h.dun&&!h.dun.id)h.dun.id='sanctum';
}
const tierMult=t=>Math.pow(1.3,t);

/* ---- dungeon runs ---- */
function startDungeon(tier,party,id='sanctum'){
  const h=H(),def=dungeonDef(id),record=dungeonStats(id);
  if(h.dun||h.lvl<def.minLvl||h.zone!==def.zone||!Number.isInteger(tier)||tier<0||tier>record.best+1||party.length!==4||new Set(party).size!==4||party.some(pid=>!npcOf(pid)||npcLvl(npcOf(pid))<def.minLvl-2))return false;
  h.party=party.slice(0,4);const keys=Object.keys(DUN_MODS),mods=[],nm=tier>=4?2:tier>=1?1:0;
  while(mods.length<nm){const k=pick(keys);if(!mods.includes(k))mods.push(k);}
  h.dun={id,tier,step:0,mods,wipes:0};h.dstats.runs++;record.runs++;syncParty();for(const p of C.party){p.hp=compStats(p.n).hpMax;p.dead=false;}
  C.mob=null;C.loot=null;C.enc=null;C.phase='seek';C.t=4;
  line(`You enter ${dungeonDef().name}${tier?` (Heroic ${tier})`:''}.`,'l-sys');toast(`${dungeonDef().name}${tier?` · Heroic ${tier}`:''}`);
  if(mods.length)line(`Modifiers: ${mods.map(k=>DUN_MODS[k].name).join(', ')}.`,'l-warn');
  if(C.party.length)say(pick(C.party).n,'greet');
}
function leaveDungeon(msg){const h=H();if(h.dun&&h.dun.raid){h.party=h.dun.prev||[];h.dun=null;C.tell=null;syncParty();}h.dun=null;C.mob=null;C.loot=null;C.surge=null;C.phase='rest';for(const p of C.party){p.dead=false;}if(msg)line(msg,'l-sys');}
function spawnDungeon(){
  if(H().dun.raid&&raidBeforeSpawn())return;
  const d=H().dun,e=dungeonDef().enc[d.step];if(!e){finishDungeon();return;}
  const tm=tierMult(d.tier),lvl=e.lvl;let hp,dmg;
  if(e.boss){hp=(30+lvl*28)*e.hpM;dmg=(3+lvl*2.3)*e.dmgM;if(d.mods.includes('tyrannical')){hp*=1.3;dmg*=1.15;}}
  else{hp=(30+lvl*28)*1.1*e.n*(e.hpM||1);dmg=(3+lvl*2.3)*(.6+.4*e.n)*1.3;if(d.mods.includes('fortified'))hp*=1.3;}
  C.mob={id:'dun'+d.step,dun:true,boss:!!e.boss,final:!!e.final,name:e.n>1?`${e.name} (${e.n})`:e.name,kind:e.kind,fam:e.fam,col:e.col,elite:!!e.boss,lvl,rar:0,traits:[],
    xpM:e.boss?6:e.n*1.2,max:Math.round(hp*tm),dmg:dmg*tm,armor:lvl*25,speed:2,swing:1.2,dots:{},chill:0,marked:0,mech:e.mech||null,
    tidal:d.mods.includes('tidal'),raging:d.mods.includes('raging'),lootN:e.loot||0};
  C.mob.hp=C.mob.max;C.phase='fight';C.lastInput=-99;C.fightT=0;C.swing=.4;C.cp=0;C.win={};C.taming=null;C.surge=null;C.guardUsed=false;C.charged=false;
  C.petSwing=.8;C.petCd=(petOf()&&FAMILIES[petOf().family].ab==='charge')?.5:4;
  if(C.mob.mech){C.waveT=(C.mob.mech.wave||0)*.6;C.surgeT=(C.mob.mech.surge||0)*.7;C.chillT=(C.mob.mech.chill||0)*.8;}
  C.chill=0;for(const p of C.party)p.chill=0; // Grave Chill never carries over between fights
  if(H().cls==='rogue'&&H().lvl>=4)openWin('opening',3+T('openWin'));
  if(d.raid)raidSpawned(e);
  line(`${e.boss?'Boss: ':''}${C.mob.name} (level ${lvl}).`,e.boss?'l-warn':'l-sys');if(e.boss){toast(`Boss: ${e.name}`);sfx('warn');}
}
function dunKill(m){
  const h=H(),d=h.dun;for(const p of C.party)addAff(p.n,m.boss?2:.5);
  const alive=partyAlive();if(alive.length&&R()<(m.boss?.9:.35))say(pick(alive).n,'kill');
  d.step++;C.dunDone=d.step>=dungeonDef().enc.length;
  if(m.boss)slog(`Defeated ${m.name}${d.tier?` (Heroic ${d.tier})`:''}.`);
  const junk={money:Math.round(m.lvl*rint(4,9)*(m.boss?6:1)),items:R()<.5?[genJunk(m.lvl,m.kind==='beast'?'beast':'humanoid')]:[]};takeLoot(junk,false);
  const gear=d.raid&&m.lootN?raidLoot(m):[];if(!d.raid)for(let i=0;i<m.lootN;i++){const ep=m.final&&R()<.15+.03*d.tier;gear.push(genItem(m.lvl+1+2*d.tier+(ep?3:0),ep?4:3,pick(SLOTS),{cls:R()<.7?h.cls:undefined}));}
  if(!gear.length){afterDungeonPull();return;}
  if((h.addons.unl.autoloot&&h.addons.on.autoloot)||aiOn()){
    for(const it of gear){if(canEquip(it)&&score(it)>score(h.gear[it.slot]))takeLoot({money:0,items:[it]},false);else giveLoot(it);}afterDungeonPull();return;}
  C.loot={money:0,items:gear,dun:true};C.phase='loot';C.t=40;
}
function giveLoot(it){const ps=partyAlive().length?partyAlive():C.party;if(!ps.length)return;const p=pick(ps);
  addAff(p.n,5,`You gave them [${it.name}].`);moodBump(p.n,10);say(p.n,'thanks');line(`You give [${it.name}] to ${p.n.name}.`,'l-loot');}
function dunLootAct(id,give){if(!C.loot||!C.loot.dun)return;const i=C.loot.items.findIndex(x=>x.id===id);if(i<0)return;const it=C.loot.items.splice(i,1)[0];C.lastInput=C.run;
  if(give)giveLoot(it);else {const left=takeLoot({money:0,items:[it]},true);if(left&&left.items.length)C.loot.items.splice(i,0,it);}if(!C.loot.items.length)afterDungeonPull();}
function afterDungeonPull(){
  C.loot=null;C.surge=null;C.buffs.vendetta=null;if(C.dunDone){C.dunDone=false;finishDungeon();return;}
  for(const p of C.party)if(p.dead){p.dead=false;p.hp=compStats(p.n).hpMax*.3;line(`${p.n.name} gets back on their feet.`,'l-sys');}
  const mana=CLASSES[H().cls].res==='mana';
  const low=C.hp<ST.hpMax*.6||(mana&&C.res<ST.resMax*.45)||C.party.some(p=>p.hp<compStats(p.n).hpMax*.6);
  if(low){C.phase='rest';line('The party catches its breath.','l-sys');}else{C.phase='seek';C.t=4;}
}
function finishDungeon(){
  if(H().dun.raid){raidFinish();return;}
  const h=H(),d=h.dun;h.dstats.clears++;const record=dungeonStats(d.id);record.clears++;const first=d.tier>record.best;record.best=Math.max(record.best,d.tier);h.dstats.best=Math.max(h.dstats.best,d.tier);
  guildXP(60);for(const p of C.party){moodBump(p.n,8);addAff(p.n,10,`Cleared ${dungeonDef().name}${d.tier?` (Heroic ${d.tier})`:''} together at level ${h.lvl}.`);}
  if(C.party.length)say(pick(C.party).n,'clear');
  slog(`Cleared ${dungeonDef().name}${d.tier?` on Heroic ${d.tier}`:''}${d.wipes?` after ${d.wipes} wipe${d.wipes>1?'s':''}`:' without a wipe'}.`);
  sfx('win');toast(`${dungeonDef().name} cleared!${first?` Heroic ${d.tier+1} unlocked.`:''}`);
  const tier=d.tier;
  if(h.addons.unl.lfg&&h.addons.on.lfg&&C.party.length===4){leaveDungeon();startDungeon(tier,h.party,d.id);line('LFG Tool: queued your group for another run.','l-sys');}
  else leaveDungeon(`You leave ${dungeonDef().name}.`);
}
