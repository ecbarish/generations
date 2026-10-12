'use strict';
function T(key){const h=H();if(!h)return 0;let s=0;for(const t of TALENT_LIST[h.cls])if(t.key===key)s+=(h.talents[t.id]||0)*t.per;return s+setT(key);} // setT: raid set bonuses (19-raid.js)
/* points spent in one talent tree, and the role your build gives you in groups (T1-A) */
function treePoints(ti,h){h=h||H();let s=0;for(const t of TALENT_LIST[h.cls])if(t.ti===ti)s+=h.talents[t.id]||0;return s;}
function heroRole(h){h=h||H();const pts=TALENTS[h.cls].map((tr,ti)=>treePoints(ti,h)),best=Math.max(...pts);return best>0?TALENTS[h.cls][pts.indexOf(best)].role:ROLE_OF[h.cls];}
function talentSpent(){const h=H();let s=0;for(const k in h.talents)s+=h.talents[k];return s;}
function talentPoints(){return Math.max(0,H().lvl-9)-talentSpent();}
/* Resetting talents: free below level 40, and one more free reset for everyone each time new trees arrive (T1-A, T1-C).
   After that 1 gold, +1 gold for each recent reset; the count drops by one for every real day without a reset. */
function respecCount(h){const days=Math.floor((Date.now()-(h.respecAt||0))/864e5);return Math.max(0,(h.respecs||0)-days);}
const TREES_V=3; // the talent trees' version: each new set of trees gives everyone one more free reset
function freeReset(h){return !h.freeRespecUsed||(h.freeTreesV||2)<TREES_V;}
function respecCost(){const h=H();return h.lvl<40||freeReset(h)?0:10000*(respecCount(h)+1);}
function respec(){const h=H(),c=respecCost();if(!talentSpent()||h.money<c)return;h.money-=c;
  if(h.lvl>=40){if(freeReset(h)){h.freeRespecUsed=true;h.freeTreesV=TREES_V;}else{h.respecs=respecCount(h)+1;h.respecAt=Date.now();}}
  h.talents={};recalc();slog(c?`Reset your talents for ${moneyTxt(c)}.`:'Reset your talents.');}

/* =================== derived stats =================== */
let ST=null;
function recalc(){
  const h=H(),K=CLASSES[h.cls],r=RACES[h.race],st={};
  for(const k in K.base)st[k]=K.base[k]+K.grow[k]*(h.lvl-1)+((r.stat&&r.stat[k])||0);
  let armor=0,w={min:1,max:3,speed:2};
  for(const sl of SLOTS){const it=h.gear[sl];if(!it||it.dur<=0)continue;for(const k in it.stats)st[k]+=it.stats[k];armor+=it.armor||0;if(sl==='weapon')w={min:it.wmin,max:it.wmax,speed:it.speed};}
  st.int*=1+T('intPct')/100;for(const k in st)st[k]=Math.round(st[k]);
  armor=Math.round((armor+st.agi*2)*(r.armor||1)*(1+T('armor')/100));
  const melee=h.cls==='warrior'||h.cls==='rogue'||h.cls==='hunter';
  const ap=h.cls==='warrior'?st.str*2:h.cls==='rogue'?st.str+st.agi:h.cls==='hunter'?st.agi*2:st.str;
  ST={st,armor,ap,sp:st.int*.6,crit:5+(melee?st.agi/20:st.int/30)+(r.crit||0)+T('crit'),dodge:3+st.agi/25+T('dodge'),
    hpMax:Math.round((30+h.lvl*10+st.sta*5)*(r.hp||1)*(1+T('hpPct')/100)),resMax:K.res==='mana'?Math.round(20+h.lvl*15+st.int*15):100,w,melee};
  if(C){C.hp=Math.min(C.hp,ST.hpMax);C.res=Math.min(C.res,ST.resMax);}
}
const xpNeed=l=>Math.round(200*l+25*l*l);
const grayDiff=l=>l<=5?5:5+Math.floor(l/10);
function con(mlvl){const d=mlvl-H().lvl;if(d>=5)return 'red';if(d>=3)return 'orange';if(d>=-2)return 'yellow';if(mlvl<=H().lvl-grayDiff(H().lvl))return 'gray';return 'green';}
function killXP(m){const h=H(),base=h.lvl*5+45,d=m.lvl-h.lvl;let x;if(m.lvl<=h.lvl-grayDiff(h.lvl))return 0;
  if(d>0)x=base*(1+.05*d);else x=base*(1-(-d)/(grayDiff(h.lvl)+1));return Math.max(1,Math.round(x*(m.elite?2:1)));}
function moneyStr(c){c=Math.floor(c);const g=Math.floor(c/10000),s=Math.floor(c%10000/100),cc=c%100;let o='';if(g)o+=`<span class="g">${g}g</span> `;if(g||s)o+=`<span class="s">${s}s</span> `;return o+`<span class="c">${cc}c</span>`;}
function moneyTxt(c){c=Math.floor(c);const g=Math.floor(c/10000),s=Math.floor(c%10000/100),cc=c%100;return (g?g+'g ':'')+(g||s?s+'s ':'')+cc+'c';}

/* =================== combat runtime =================== */
let C=null;
function freshC(){return {phase:'seek',t:1.5,mob:null,hp:ST?ST.hpMax:100,res:0,cp:0,gcd:0,cast:null,cds:{},buffs:{},win:{},swing:0,ai:0,aiArmed:false,
  absorb:0,loot:null,party:[],fightT:0,lastCast:-99,run:0,lastInput:-99,lastKill:0,err:'',errT:0,lines:[],fx:[],anim:{hero:0,mob:0}};}
// Explicit Auto remains a choice; Focus fallback starts only after a first victory.
function aiOn(){const h=H();return !!(h&&C&&!RTALK&&(h.mode==='auto'||h.stats.kills>0&&C.run-C.lastInput>15));}
function engaged(){return H().mode==='focus'&&C.run-C.lastInput<=10;}
function macroRank(){const h=H();if(!(h.addons.unl.macro&&h.addons.on.macro))return 0;const u=h.stats.manual;return u>=6000?3:u>=2000?2:1;}
function aiEff(){return [.55,.7,.8,.9][macroRank()];}
function line(txt,cls){C.lines.push({txt,cls});if(C.lines.length>60)C.lines.shift();}
function fx(txt,col,who,big){if(C.fx.length>24)C.fx.shift();C.fx.push({txt,col,who,big,age:0,x:R()});}
function err(msg){C.err=msg;C.errT=1.6;}
function slog(m){const h=H();if(!h)return;h.log=h.log||[];h.log.unshift(m);if(h.log.length>40)h.log.length=40;}

/* ---- damage helpers ---- */
function critRoll(extra){return R()*100<(C.buffs.vendetta?100:ST.crit+(extra||0)+(C.buffs.combustion?50:0)+(C.buffs.trueshot?15:0));}
function wroll(){return ST.w.min+R()*(ST.w.max-ST.w.min)+ST.ap/14*ST.w.speed+(C.buffs.cry?C.buffs.cry.ap/14*ST.w.speed:0);}
function dmgMods(){let m=(1+T('dmg')/100)*(C.raidDmg||1)*(C.buffs.enrage?1+T('enrageDmg')/100:1)*(C.buffs.deathwish?1.4:1)*(C.buffs.arcpower?1.35:1)*(C.mob&&C.mob.marked>0?1.1:1)*(C.buffs.howl?1.1:1)*(C.buffs.pack?1.2:1)*(C.buffs.shadowform?1.3:1)*(C.buffs.trueshot?1.25:1);const d=C.mob.lvl-H().lvl;if(d>0)m*=1-.04*d;if(RACES[H().race].bloodrage&&C.hp<ST.hpMax*.3)m*=1.1;return m;}
function hitMob(amount,o){
  o=o||{};const m=C.mob;if(!m)return 0;
  if(o.phys&&!o.sure&&R()<.05+.005*Math.max(0,m.lvl-H().lvl)){line(`${o.label||'Your attack'} was dodged by ${m.name}.`,'l-hit');fx('Dodge','#ccc','mob');
    if(H().cls==='warrior'&&H().lvl>=6)openWin('counter',4+T('window'));return 0;}
  let a=amount*dmgMods()*(o.auto&&C.buffs.flurry?1.5:1);if(o.phys)a*=1-m.armor/(m.armor+400+85*H().lvl);
  const cold=!o.noCrit&&!!C.buffs.coldblood;if(cold)C.buffs.coldblood=null; // Cold Blood: a sure crit at double crit damage
  const crit=cold||(o.noCrit?false:critRoll(o.critBonus));if(crit)a*=2*(1+T('critDmg')/100)*(cold?2:1);a=Math.max(1,Math.round(a*(.92+R()*.16)));
  m.hp-=a;C.anim.mob=.15;
  line(`${o.label||'Your attack'} ${crit?'crits':'hits'} ${m.name} for ${a}.`,crit?'l-crit':'l-hit');fx(String(a)+(crit?'!':''),crit?'#ffd24a':'#fff','mob',crit);
  if(crit&&T('bleed'))addDot('ignite',a*T('bleed')/100,6,'Ignite');
  if(crit&&T('enrageDmg'))C.buffs.enrage={t:8}; // Enrage (Fury)
  if(H().cls==='warrior'&&o.phys&&o.auto)C.res=Math.min(100,C.res+clamp(a/(H().lvl*3+10)*7.5,3,25)*(1+T('rageGen')/100));
  if(m.hp<=0)onKill();return a;
}
function healHero(n,label){const a=Math.round(n*(1+T('heal')/100));C.hp=Math.min(ST.hpMax,C.hp+a);warmUp('hero');line(`${label} heals you for ${a}.`,'l-heal');fx('+'+a,'#7cf08a','hero');}
function addDot(id,total,dur,label){if(!C.mob)return;C.mob.dots[id]={per:total/(dur/3),left:Math.round(dur/3),t:3,label};}
function openWin(id,dur){C.win[id]=dur;C.win[id+'_ai']=macroRank()>=3&&R()<.5;}

/* ---- the loop ---- */
function zoneMobs(){return ZONES[H().zone].mobs;}
function targetMob(){
  const h=H();const z=zoneMobs();
  if(h.grind){const m=z.find(x=>x.id===h.grind);if(m)return m;}
  for(const qid of h.quests.active){const q=ALLQ[qid];if(q.zone!==h.zone)continue;if((h.quests.prog[qid]||0)>=q.n)continue;const m=z.find(x=>x.id===q.mob);if(m)return m;}
  const ok=z.filter(m=>!m.rare&&m.lv[0]<=h.lvl);return ok.length?ok[ok.length-1]:z[0];
}
function spawn(){
  if(H().dun){spawnDungeon();return;}
  const t=targetMob(),lvl=rint(t.lv[0],t.lv[1]),e=!!t.elite,beast=t.kind==='beast';
  const rar=beast?wildRarity(t):0;let name=t.name,col=t.col,petName=t.name;
  if(rar===1)name=petName=`${pick(UNCOMMON_PRE)} ${t.name}`;
  else if(rar===2){const v=pick(RARE_VAR);name=petName=`${v.n} ${t.name}`;col=v.c;}
  else if(rar===3){name=petName=pick(EPIC_NAMES[t.fam]||[t.name]);col=pick(RARE_VAR).c;}
  const rm=t.rare?1:1+.15*rar;
  C.mob={id:t.id,name,kind:t.kind,col,elite:e,lvl,rar,fam:t.fam,species:t.name,petName,traits:beast?rollTraits(rar):[],xpM:t.rare?1:1+.25*rar,
    max:Math.round((30+lvl*28)*(e?3.2:1)*rm),dmg:(3+lvl*2.3)*(e?1.5:1)*(t.rare?1:1+.08*rar),armor:lvl*25,speed:e?2.2:2,swing:1.2,dots:{},chill:0,marked:0};
  C.mob.hp=C.mob.max;C.phase='fight';C.fightT=0;C.swing=.4;C.cp=0;C.win={};C.taming=null;
  C.petSwing=.8;C.petCd=(petOf()&&FAMILIES[petOf().family].ab==='charge')?.5:4;C.guardUsed=false;C.charged=false;
  if(H().cls==='rogue'&&H().lvl>=4)openWin('opening',3+T('openWin'));
  line(`You attack ${name} (level ${lvl}${e?' elite':''}${beast&&rar?`, ${RARITY[rar].name.toLowerCase()}`:''}).`,'l-sys');
  if(beast&&rar>=2&&!t.rare)toast(`A ${RARITY[rar].name} beast: ${name}!`);
}
function onKill(){
  const h=H(),m=C.mob;C.mob=null;C.cast=null;C.taming=null;if(!h.stats.kills)C.lastInput=C.run; // give the player a full 15 seconds after their first victory
  h.stats.kills++;
  line(`${m.name} dies.`,'l-sys');
  // xp
  let x=groupXP(Math.round(killXP(m)*(m.xpM||1)));if(engaged())x=Math.round(x*1.1);gainXP(x,true);petGain(x);
  if(m.dun){dunKill(m);return;}
  for(const p of C.party){addAff(p.n,.2);}if(C.party.length&&R()<.15)say(pick(C.party).n,'kill');
  // quest progress
  for(const qid of h.quests.active){const q=ALLQ[qid];if(q.mob!==m.id)continue;const p=h.quests.prog[qid]||0;if(p>=q.n)continue;
    if(q.type==='kill'||R()<.6){h.quests.prog[qid]=p+1;const it=q.type==='kill'?`${m.name} slain`:ZONES[q.zone].mobs.find(x=>x.id===q.mob).drop;
      toast(`${it}: ${p+1}/${q.n}`);if(p+1>=q.n){toast(`${q.name} (Complete)`);line(`${q.name} complete. Return to ${giver(q)}.`,'l-sys');}}}
  // loot
  const loot={money:0,items:[]};
  if(m.kind==='humanoid')loot.money=Math.round(m.lvl*rint(2,6)*(m.elite?5:1));
  if(R()<.55)loot.items.push(genJunk(m.lvl,m.kind));
  if(m.kind==='beast'&&R()<.28)loot.items.push(genFood('meat',m.lvl));
  const rr=R();
  if(m.elite)loot.items.push(genItem(m.lvl+1,3,pick(SLOTS),{cls:h.cls}));
  if(REINS[m.id]&&R()<.25)loot.items.push({id:uid(),mountItem:true,rar:4,name:REINS[m.id].name,mid:m.id,value:500});
  else if(rr<.004)loot.items.push(genItem(m.lvl+2,3,pick(SLOTS)));
  else if(rr<.045)loot.items.push(genItem(m.lvl,2,pick(SLOTS)));
  else if(rr<.12)loot.items.push(genItem(m.lvl,1,pick(SLOTS.filter(s=>s!=='trinket'))));
  if(loot.items.some(i=>i.rar>=2))sfx('loot');
  // timing stats for offline estimates
  const cyc=Math.max(5,C.run-C.lastKill);C.lastKill=C.run;const a=h.avg;a.cycle=a.cycle*.8+cyc*.2;a.xp=a.xp*.8+x*.2;a.money=a.money*.8+(loot.money+loot.items.filter(i=>i.junk).reduce((s,i)=>s+i.value,0))*.2;
  // ordering: elites end the fight with a guaranteed look at the loot
  const auto=h.addons.unl.autoloot&&h.addons.on.autoloot;
  if(!loot.money&&!loot.items.length){afterFight();return;}
  if(auto){takeLoot(loot,false);afterFight();return;}
  if(aiOn()&&!m.elite){if(loot.money)takeLoot({money:loot.money,items:[]},false);if(loot.items.length)line('You leave the rest of the loot on the corpse.','l-hurt');afterFight();return;}
  C.loot=loot;C.phase='loot';C.t=aiOn()?3:12;
}
function takeLoot(loot,manual){
  const h=H();if(loot.money){h.money+=loot.money;h.stats.money+=loot.money;line(`You loot ${moneyTxt(loot.money)}.`,'l-loot');}
  for(const it of loot.items){if(h.bags.length>=16){err('Inventory is full.');line(`Inventory is full. ${it.name} was left behind.`,'l-hurt');continue;}
    h.bags.push(it);line(`You receive loot: [${it.name}].`,'l-loot');if(it.rar>=2)toast(`Loot: ${it.name}`);
    if(h.addons.unl.gearcmp&&h.addons.on.gearcmp)autoEquip(it);}
  if(manual)h.stats.loots++;
}
function afterFight(){
  if(H().dun){afterDungeonPull();return;}
  const h=H();C.loot=null;C.buffs.vendetta=null;
  let lowGear=SLOTS.some(s=>h.gear[s]&&h.gear[s].dur<30);if(lowGear&&aiOn()&&useKit(true))lowGear=false;
  const sweep=h.addons.unl.sweep&&h.addons.on.sweep;
  if(aiOn()&&(lowGear||(sweep&&h.bags.length>=16))){C.phase='town';C.t=travel(10);line('Heading back to town.','l-sys');return;}
  const mana=CLASSES[h.cls].res==='mana';
  if(C.hp<ST.hpMax*.55||(mana&&C.res<ST.resMax*.4)){C.phase='rest';line('You sit down to rest.','l-sys');return;}
  C.phase='seek';C.t=travel(2.5);maybeEncounter();
}
/* Pacing (decided 2026-10-08, docs/research/decisions.md). Kill XP is shared by the group like classic MMOs: each
   member gets XP x bonus / size (no bonus for 2; x1.166, x1.3, x1.4 for 3, 4, 5). Quest XP stays whole. Each hero's
   journey length (h.pace) scales all XP: Breezy x1.6, Classic x1, Long Road x0.6. */
const PACE={breezy:{name:'Breezy',xp:1.6,desc:'A quicker climb: 60% more experience.'},classic:{name:'Classic',xp:1,desc:'The intended pace.'},
  long:{name:'Long Road',xp:.6,desc:'For the grind: 40% less experience. Every level is earned.'}};
const GROUP_BONUS=[1,1,1,1.166,1.3,1.4];
function paceMult(){return (PACE[H().pace]||PACE.classic).xp;}
// L7b/R8: the late zones have their own pace budget; earlier zones retain their XP.
function zoneXPMult(){return H().lvl >= 40 ? (ZONES[H().zone].xpMult || 1) : 1;}
function groupXP(x){const n=1+(C&&C.party?C.party.length:0);return n<2?x:Math.max(1,Math.round(x*GROUP_BONUS[Math.min(5,n)]/n));}
function gainXP(x,kill){
  const h=H();if(h.lvl>=LEVEL_CAP){return;}
  x=Math.round(x*paceMult()*guildXPMult()*zoneXPMult());let bonus=0;if(kill&&h.rested>0){bonus=Math.min(x,h.rested);h.rested-=bonus;}
  h.xp+=x+bonus;line(`You gain ${x} experience${bonus?` (+${Math.round(bonus)} rested)`:''}.`,'l-xp');
  while(h.lvl<LEVEL_CAP&&h.xp>=xpNeed(h.lvl)){h.xp-=xpNeed(h.lvl);h.lvl++;onLevel();}
  if(h.lvl>=LEVEL_CAP){h.xp=0;h.rested=0;}
}
function onLevel(){
  const h=H();recalc();C.hp=ST.hpMax;if(CLASSES[h.cls].res==='mana')C.res=ST.resMax;
  toast(`Ding! Level ${h.lvl}`,'ding');sfx('level');slog(`Reached level ${h.lvl}.`);
  const learned=bar().filter(a=>!a.talent&&a.lvl===h.lvl);for(const a of learned){toast(`New ability: ${a.name}`);line(`You have learned ${a.name}.`,'l-sys');}
  if(h.lvl>=10)line('You have a talent point to spend.','l-sys');
  if(h.lvl===10)toast('Talents unlocked');
  if(h.lvl===20)toast('Ashen Ridge awaits. Travel there for new quests.');
  if(h.lvl===LEVEL_CAP)toast('Level cap for this version reached');
}
function die(){
  const h=H();h.stats.deaths++;C.mob=null;C.cast=null;C.loot=null;C.phase='dead';C.t=15+h.lvl;C.absorb=0;C.buffs={};
  for(const s of SLOTS){const it=h.gear[s];if(it)it.dur=Math.max(0,it.dur-10);}recalc();
  line('You have died. Your gear lost 10% durability.','l-hurt');sfx('lose');toast('You have died');slog(`Died at level ${h.lvl}.`);
  C.taming=null;C.surge=null;const p=petOf();if(p&&p.hp>0){p.hp=0;p.happy=Math.max(0,p.happy-10);line(`${p.name} falls beside you.`,'l-hurt');}
  if(h.dun){h.dun.wipes++;line('The party wipes. Everyone runs back in.','l-hurt');for(const q of C.party){q.dead=false;q.hp=compStats(q.n).hpMax;}if(C.party.length)say(pick(C.party).n,'wipe');}
}
function step(h){
  if(typeof realmNotebookOpen==='function' && realmNotebookOpen())return; // Reading carried paperwork pauses the world.
  if(RTALK || modalKind === 'memberstories')return; // deliberate stories pause the world, never pick an outcome for the player
  memberStoryTick(h);
  const he=H();C.run+=h;he.stats.play+=h;
  C.gcd=Math.max(0,C.gcd-h);for(const k in C.cds)C.cds[k]=Math.max(0,C.cds[k]-h);
  if(C.phase==='fight')autoPotion(); // healing potions from the supply bank (18-supplies.js)
  if(he.dun&&he.dun.raid&&raidStep(h))return; // raid plans, tells and calls (19-raid.js)
  for(const k in C.win)if(typeof C.win[k]==='number')C.win[k]=Math.max(0,C.win[k]-h);
  for(const k in C.buffs){const b=C.buffs[k];if(!b)continue;b.t-=h;if(b.t<=0){C.buffs[k]=null;if(k==='absorb')C.absorb=0;}}
  if(C.errT>0)C.errT-=h;C.anim.hero=Math.max(0,C.anim.hero-h);C.anim.mob=Math.max(0,C.anim.mob-h);
  const K=CLASSES[he.cls],mana=K.res==='mana';
  // resource regen
  if(K.res==='energy')C.res=Math.min(100,C.res+10*(1+T('energyRegen')/100)*(C.buffs.adrenaline?3:1)*h);
  if(K.res==='rage'&&C.phase!=='fight')C.res=Math.max(0,C.res-3*h);
  switch(C.phase){
    case 'seek':C.t-=h;C.hp=Math.min(ST.hpMax,C.hp+ST.hpMax*.01*h);if(mana)C.res=Math.min(ST.resMax,C.res+ST.resMax*.02*h);if(C.t<=0)spawn();break;
    case 'rest':{C.hp=Math.min(ST.hpMax,C.hp+ST.hpMax*.07*h);if(mana)C.res=Math.min(ST.resMax,C.res+ST.resMax*.07*h);
      const p=petOf(),petOk=!p||p.hp<=0?!(p&&C.reviving>0):p.hp>=petStats(p).hpMax*.9;
      const partyOk=C.party.every(q=>q.dead||q.hp>=compStats(q.n).hpMax*.9);
      if(C.hp>=ST.hpMax*.97&&(!mana||C.res>=ST.resMax*.95)&&petOk&&partyOk){C.phase='seek';C.t=he.dun?4:travel(2.5);}break;}
    case 'loot':C.t-=h;if(C.t<=0){
      if(C.loot&&C.loot.dun){for(const it of C.loot.items)giveLoot(it);afterDungeonPull();break;}
      if(C.loot&&aiOn()&&C.loot.money)takeLoot({money:C.loot.money,items:[]},false);if(C.loot&&C.loot.items.length)line('The corpse decays. Some loot was left behind.','l-hurt');afterFight();}break;
    case 'dead':C.t-=h;if(C.t<=0){C.hp=ST.hpMax*.5;if(mana)C.res=ST.resMax*.5;C.phase='rest';line('You return to your body.','l-sys');}break;
    case 'town':C.t-=h;if(C.t<=0){C.phase='intown';line(`You arrive at ${hubName()}.`,'l-sys');
        if(he.addons.unl.sweep&&he.addons.on.sweep)sellJunk(true);if(he.addons.unl.petcare&&he.addons.on.petcare&&he.bags.filter(i=>i.food).length<3)buyFood(true);C.townT=3;}break;
    case 'intown':if(townAuto()){C.townT-=h;if(C.townT<=0){repairAll(true);leaveTown();}}break;
    case 'fight':fight(h,mana);break;
  }
  if(he.pets&&he.pets.length)petTick(h,C.phase);
  if(C.phase!=='fight')for(const q of C.party){if(q.dead)continue;const mx=compStats(q.n).hpMax;q.hp=Math.min(mx,q.hp+mx*(C.phase==='rest'?.08:.02)*h);}
  if(C.enc){C.enc.t-=h;if(C.enc.t<=0||he.dun)C.enc=null;}
  C.upk=(C.upk||0)+h;if(C.upk>=1){C.upk=0;partyUpkeep();}
  if(!he.dun&&(C.phase==='seek'||C.phase==='town')){const mt=activeMount();if(mt){const b=trainLvl(mt.xp||0);mt.xp=(mt.xp||0)+h;const a=trainLvl(mt.xp);
    if(a>b){toast(`${mt.name} is now ${MOUNT_TRAIN[a].n}`);slog(`${mt.name} reached ${MOUNT_TRAIN[a].n} training.`);}}}
  if(C.phase!=='fight'&&C.cast)C.cast=null;
  C.anim.pet=Math.max(0,(C.anim.pet||0)-h);
}
/* ---- party combat ---- */
function syncParty(){const h=H();C.party=(h.party||[]).map(id=>{const n=npcOf(id);if(!n)return null;const old=(C.party||[]).find(p=>p.id===id);
  return old?Object.assign(old,{n}):{id,n,hp:compStats(n).hpMax,swing:1+R(),healT:1.5,dead:false};}).filter(Boolean);}
function partyAlive(){return (C&&C.party||[]).filter(p=>!p.dead);}
function hasRole(r){return partyAlive().some(p=>(p.n.role||ROLE_OF[p.n.cls])===r);}
function compsAct(h){
  for(const p of C.party){if(p.dead)continue;const s=compStats(p.n);
    p.swing-=h;if(p.swing<=0&&C.mob){p.swing=2;let a=s.dps*2*(.85+R()*.3)*(C.buffs.pack?1.2:1)*(C.mob.marked>0?1.1:1);const crit=R()<.1;if(crit)a*=2;a=Math.max(1,Math.round(a*.85*(C.raidDmg||1)));
      C.mob.hp-=a;fx(String(a)+(crit?'!':''),crit?'#ffd24a':'#cfe3ff','mob',crit);if(crit||R()<.25)line(`${p.n.name} ${crit?'crits':'hits'} ${C.mob.name} for ${a}.`,'l-party');
      if(C.mob.hp<=0){onKill();return;}}
    if(s.role==='heal'){p.healT-=h;if(p.healT<=0){p.healT=2.5;healLowest(s.hps*2.5,p.n.name);}}}
}
function healLowest(amount,who){
  const opts=[{k:'hero',pct:C.hp/ST.hpMax,chill:C.chill||0}];for(const p of partyAlive())opts.push({k:p,pct:p.hp/compStats(p.n).hpMax,chill:p.chill||0});
  const pet=petOf();if(pet&&pet.hp>0)opts.push({k:'pet',pct:pet.hp/petStats(pet).hpMax});
  // healers go for the most hurt, counting each Grave Chill stack as 8% missing health
  opts.sort((a,b)=>(a.pct-.08*(a.chill||0))-(b.pct-.08*(b.chill||0)));const t=opts[0];if(t.pct>=.98&&!t.chill)return;const a=Math.round(amount);
  if(t.k==='hero'){C.hp=Math.min(ST.hpMax,C.hp+a);warmUp('hero');fx('+'+a,'#7cf08a','hero');line(`${who} heals you for ${a}.`,'l-heal');}
  else if(t.k==='pet'){pet.hp=Math.min(petStats(pet).hpMax,pet.hp+a);fx('+'+a,'#7cf08a','pet');}
  else{t.k.hp=Math.min(compStats(t.k.n).hpMax,t.k.hp+a);warmUp(t.k);fx('+'+a,'#7cf08a','party');if(R()<.3)line(`${who} heals ${t.k.n.name===who?'themselves':t.k.n.name} for ${a}.`,'l-heal');}
}
function pickTarget(){
  const opts=[],tankUp=hasRole('tank');opts.push({k:'hero',w:(heroRole()==='tank'?(tankUp?2:6)*(1+T('threat')/100):1)*(C.buffs.taunt?3:1)});
  const pet=petOf();if(pet&&pet.hp>0)opts.push({k:'pet',w:petStats(pet).taunt*4*(1+T('petThreat')/100)});
  for(const p of partyAlive()){const r=ROLE_OF[p.n.cls];opts.push({k:p,w:r==='tank'?8:r==='heal'?1.3:1});}
  let r=R()*opts.reduce((s,o)=>s+o.w,0);for(const o of opts){r-=o.w;if(r<=0)return o.k;}return 'hero';
}
function hitComp(p,raw){const s=compStats(p.n);let a=raw*(1-s.armor/(s.armor+400+85*C.mob.lvl))*(C.buffs.bulwark?.7:1)*(C.buffs.painsup?.6:1)*(C.raidTaken||1);a=Math.max(1,Math.round(a));
  p.hp-=a;fx('-'+a,'#ffb38a','party');if(p.hp<=0){p.hp=0;p.dead=true;line(`${p.n.name} has fallen!`,'l-hurt');}}
function hitPet(raw){const pp=petOf(),ps=petStats(pp);let a=raw*(1-ps.armor/(ps.armor+400+85*C.mob.lvl))*(C.buffs.bulwark?.7:1)*(C.buffs.painsup?.6:1)*(C.raidTaken||1);a=Math.max(1,Math.round(a));
  pp.hp-=a;line(`${C.mob.name} hits ${petLabel(pp).replace(/^Your /,'your ')} for ${a}.`,'l-hurt');fx('-'+a,'#ff9a7a','pet');if(pp.hp<=0)petDie();}
/* returns true if the hit killed you */
function hitHero(raw,label){const m=C.mob,he=H();let a=raw*(1-ST.armor/(ST.armor+400+85*m.lvl));const d=m.lvl-he.lvl;if(d>0)a*=1+.04*d;if(C.buffs.bulwark)a*=.7;
  if(C.buffs.shieldwall)a*=.4;if(C.buffs.shadowform)a*=.85;if(C.buffs.deathwish)a*=1.1;if(C.buffs.painsup)a*=.6;a*=C.raidTaken||1;
  if(T('block')&&hasShield()&&R()*100<T('block')){a*=.5;fx('Block','#cfd8e3','hero');}
  a=Math.max(1,Math.round(a));
  if(C.absorb>0){const ab=Math.min(C.absorb,a);C.absorb-=ab;a-=ab;if(ab)fx('Absorb','#9cc8ff','hero');}
  if(a>0){C.hp-=a;line(`${label||m.name+' hits you'} for ${a}.`,'l-hurt');fx('-'+a,'#ff6a5a','hero');if(he.cls==='warrior')C.res=Math.min(100,C.res+a/(he.lvl*3+10)*2.5);}
  if(C.hp<=0){const gp=petOf();
    if(gp&&gp.hp>0&&bondLvl(gp)>=4&&!C.guardUsed){C.guardUsed=true;C.hp=Math.round(ST.hpMax*.15);gp.hp=Math.max(1,gp.hp-a);line(`${gp.name} throws itself in front of the blow!`,'l-sys');toast(`${gp.name} saved you`);}
    else{die();return true;}}
  return false;}
function bossWave(m){line(`${m.name} calls ${dungeonDef().waveName}!`,'l-warn');const raw=m.dmg*.8;
  for(const p of partyAlive())hitComp(p,raw*(.9+R()*.2));const pet=petOf();if(pet&&pet.hp>0)hitPet(raw);return hitHero(raw,`The ${dungeonDef().waveName} hits you`);}
function bossSurge(m){const raw=m.dmg*3;
  for(const p of partyAlive()){if(R()>=.45+.1*affLvl(p.n))hitComp(p,raw*.8);}
  if(C.dodged){line(`You dodge ${dungeonDef().surgeName}.`,'l-sys');sfx('dodge');fx('Dodged!','#7cf08a','hero');return false;}
  return hitHero(raw,`${dungeonDef().surgeName} slams you`);}
/* Grave Chill (the Silent Barrows, T1-B): every mech.chill seconds the boss lays one stack on you and every companion
   (max 5). Each stack costs 1.5% of max health per second. Any heal on someone takes one of their stacks off
   (healLowest, healHero); Circle of Light clears them all. A party without a healer slowly freezes.
   Returns true if the cold killed you. */
const CHILL_MAX=5,CHILL_PCT=.015;
function graveChill(m,h){
  C.chillT-=h;if(C.chillT<=0){C.chillT=m.mech.chill*(m.tidal?.7:1);C.chill=Math.min(CHILL_MAX,(C.chill||0)+1);
    for(const p of partyAlive())p.chill=Math.min(CHILL_MAX,(p.chill||0)+1);
    line(`${m.name} breathes Grave Chill over the party.`,'l-warn');if((C.chill||0)===1)toast('Grave Chill! Heal it off.');}
  C.chillTick=(C.chillTick||0)+h;if(C.chillTick<1)return false;C.chillTick-=1;
  for(const p of partyAlive())if(p.chill){const mx=compStats(p.n).hpMax;p.hp-=mx*CHILL_PCT*p.chill;if(p.hp<=0){p.hp=0;p.dead=true;line(`${p.n.name} freezes and falls.`,'l-hurt');}}
  if(C.chill){const a=Math.max(1,Math.round(ST.hpMax*CHILL_PCT*C.chill));C.hp-=a;fx('-'+a,'#bfe3ff','hero');if(C.hp<=0){die();return true;}}
  return false;
}
function warmUp(who){if(who==='hero'){if(C.chill)C.chill--;}else if(who&&who.chill)who.chill--;}
function dodgeNow(){if(!(C.win.dodge>0&&C.surge))return;C.dodged=true;C.win.dodge=0;C.lastInput=C.run;line('You brace and leap clear.','l-sys');}
function doCombo(manual){
  const p=C.party.find(x=>x.id===C.comboWith&&!x.dead);if(!p||!(C.win.combo>0)||!C.mob)return;C.win.combo=0;if(manual)C.lastInput=C.run;
  const n=p.n,s=compStats(n),am=1+.15*Math.max(0,affLvl(n)-2),base=(ST.melee?wroll():20+H().lvl*4+ST.sp)*am,ck=COMBO[n.cls];
  line(`Combo with ${n.name}: ${ck.name}!`,'l-sys');toast(`${ck.name}!`);addAff(n,1);
  switch(n.cls){
    case 'warrior':C.buffs.bulwark={t:6};hitMob(base*2+s.dps*6,{sure:1,label:ck.name});break;
    case 'priest':{const pct=.25*am;C.hp=Math.min(ST.hpMax,C.hp+ST.hpMax*pct);for(const q of partyAlive())q.hp=Math.min(compStats(q.n).hpMax,q.hp+compStats(q.n).hpMax*pct);
      const pet=petOf();if(pet&&pet.hp>0)pet.hp=Math.min(petStats(pet).hpMax,pet.hp+petStats(pet).hpMax*pct);fx('+heal','#7cf08a','hero');hitMob(base*1.2,{sure:1,label:ck.name});break;}
    case 'mage':hitMob(base*1.5+s.dps*10,{sure:1,label:ck.name});break;
    case 'rogue':hitMob(base*2.2+s.dps*6,{sure:1,critBonus:100,label:ck.name});break;
    case 'hunter':C.buffs.pack={t:8};hitMob(base*1.3+s.dps*6,{sure:1,label:ck.name});break;
  }
}
function fight(h,mana){
  const m=C.mob,he=H();if(!m){C.phase='seek';C.t=1;return;}
  C.fightT+=h;
  if(mana)C.res=Math.min(ST.resMax,C.res+ST.st.spi*(C.fightT-C.lastCast>5?.1:.025)*(1+T('regenPct')/100)*h);
  if(m.marked>0)m.marked-=h;
  // taming: the hero channels, the beast keeps attacking
  if(C.taming){C.taming.t-=h;if(C.taming.t<=0){finishTame();return;}}
  // the pet
  const pet=petOf();
  if(pet&&pet.hp>0&&!C.taming){C.petSwing-=h*(C.buffs.frenzy?1.4:1)*(C.buffs.packfury?1.3:1);
    if(C.petSwing<=0){C.petSwing=petStats(pet).speed;petHit(1);if(!C.mob)return;}
    C.petCd-=h;if(C.petCd<=0){petAbility();if(!C.mob)return;}}
  // casting
  if(C.cast){C.cast.t-=h;if(C.cast.t<=0){const a=C.cast.a;C.cast=null;C.anim.hero=.2;a.fn();if(!C.mob)return;}}
  // auto attack (casters swing only when not casting)
  if(!C.cast&&!C.taming){C.swing-=h*(C.buffs.quicken?1.3:1)*(1+T('swingSpeed')/100);if(C.swing<=0){C.swing=ST.w.speed;C.anim.hero=.15;
    hitMob(wroll(),{phys:1,auto:1,label:'Your attack'});if(!C.mob)return;
    if(he.cls==='warrior'&&he.lvl>=6&&R()<.06)openWin('counter',4+T('window'));}}
  // dots
  for(const k in m.dots){const d=m.dots[k];d.t-=h;if(d.t<=0){d.t=3;d.left--;const a=Math.max(1,Math.round(d.per*dmgMods()));m.hp-=a;line(`${m.name} suffers ${a} from ${d.label}.`,'l-hit');if(k==='sting'&&T('lockload')&&!C.buffs.lnl&&R()<.2){C.buffs.lnl={t:12};line('Lock and Load: your next Steady Shot is instant.','l-sys');}fx(String(a),'#e6c35a','mob');
    if(d.left<=0)delete m.dots[k];if(m.hp<=0){onKill();return;}}}
  // companions
  if(C.party.length){compsAct(h);if(!C.mob||C.phase!=='fight')return;}
  // boss mechanics
  if(!(m.mech&&m.mech.chill))C.chill=0; // Grave Chill only lives in the Silent Barrows' boss fights
  if(m.mech){
    if(m.mech.wave){C.waveT-=h;if(C.waveT<=0){C.waveT=m.mech.wave*(m.tidal?.7:1);if(bossWave(m))return;}}
    if(m.mech.surge&&!C.surge){C.surgeT-=h;if(C.surgeT<=0){C.surgeT=m.mech.surge*(m.tidal?.7:1);C.surge={t:2.5};C.dodged=false;openWin('dodge',2.5);
      line(`${m.name} begins to cast ${dungeonDef().surgeName}!`,'l-warn');toast(`${dungeonDef().surgeName}! Press D to dodge`);sfx('warn');if(aiOn()&&R()<aiEff()*.75)C.dodged=true;}}
    if(C.surge){C.surge.t-=h;if(C.surge.t<=0){C.surge=null;C.win.dodge=0;if(bossSurge(m))return;}}
    if(m.mech.chill&&graveChill(m,h))return;
    if(m.mech.enrage&&!m.enraged&&C.fightT>m.mech.enrage){m.enraged=true;line(`${m.name} becomes enraged!`,'l-warn');toast(`${m.name} is enraged`);}
  }
  // combined abilities with friends
  const friends=partyAlive().filter(p=>affLvl(p.n)>=2);
  if(friends.length&&!(C.win.combo>0)){C.comboT=(C.comboT===undefined?8:C.comboT)-h;if(C.comboT<=0){C.comboT=14+R()*6;const p=pick(friends);C.comboWith=p.id;openWin('combo',5);say(p.n,'combo');}}
  // mob swing: the enemy picks a target, and tanks draw most attacks
  if(m.chill>0)m.chill-=h;
  // Renew: healing over time on whoever is hurt worst
  const rn=C.buffs.renew;if(rn){rn.tick-=h;if(rn.tick<=0){rn.tick=3;healLowest(rn.amt,'Renew');}}
  // Deep Freeze: a frozen enemy can't swing
  if(m.frozen>0){m.frozen-=h;m.swing=Math.max(m.swing,.3);}
  m.swing-=h*(m.chill>0?.6:1)*(m.frozen>0?0:1);
  if(m.swing<=0){m.swing=m.speed;C.anim.mob=-.18;
    const raw=m.dmg*(.85+R()*.3)*(m.raging&&m.hp<m.max*.3?1.4:1)*(m.enraged?2.5:1);const tg=pickTarget();
    if(tg==='pet')hitPet(raw);
    else if(tg!=='hero')hitComp(tg,raw);
    else if(R()*100<ST.dodge){line(`${m.name} attacks. You dodge.`,'l-hit');fx('Dodge','#ccc','hero');if(he.cls==='rogue'&&he.lvl>=6)openWin('riposte',4);}
    else if(ST.melee&&R()<.05){line(`${m.name} attacks. You parry.`,'l-hit');fx('Parry','#ccc','hero');if(he.cls==='rogue'&&he.lvl>=6)openWin('riposte',4);}
    else if(hitHero(raw))return;}
  // the hero's decision
  if(aiOn()&&C.win.combo>0&&C.win.combo_ai)doCombo(false);
  if(!C.mob)return;
  if(aiOn()&&!C.cast&&!C.taming&&C.gcd<=0){
    if(!C.aiArmed){C.aiArmed=true;C.ai=(1-aiEff())*1.5;}
    else{C.ai-=h;if(C.ai<=0){C.aiArmed=false;
      for(const a of aiList()){if(a.react&&!C.win[a.react+'_ai'])continue;if(!canUse(a,true))continue;if(a.ai&&!a.ai())continue;useAb(a,false);break;}}}
  }
}
