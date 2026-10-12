'use strict';
function genItem(ilvl,rar,slot,o){
  o=o||{};ilvl=Math.max(1,Math.round(ilvl));const cls=o.cls||pick(Object.keys(CLASSES));const K=CLASSES[cls];
  const it={id:uid(),slot,ilvl,rar,stats:{},dur:100};const tier=ilvl <= 20 ? Math.min(3, Math.floor((ilvl - 1) / 5)) : Math.min(7, 3 + Math.ceil((ilvl - 20) / 10));let base;
  if(slot==='weapon'){const type=o.type||pick(K.weap),W=WEAPONS[type];it.wtype=type;it.speed=W.speed;
    const dps=(ilvl*.7+2.5)*[.8,1,1.15,1.3,1.5][rar];it.wmin=Math.max(1,Math.round(dps*W.speed*.8));it.wmax=Math.round(dps*W.speed*1.2)+1;base=W.names[tier];}
  else if(slot==='offhand'){const type=o.type||K.off;it.otype=type;base=OFFH[type][tier];if(type==='shield')it.armor=Math.round(8*(ilvl*2+5)*[.8,1,1.1,1.25,1.4][rar]);}
  else if(slot==='trinket'){base=TRINKETS[tier];if(rar<2)rar=it.rar=2;}
  else{const at=o.atype||K.armor[0];it.atype=at;base=`${MAT[at][tier]} ${pick(PIECE[at][slot])}`;it.armor=Math.round(ARM_MULT[at]*SLOT_MULT[slot]*(ilvl*2+5)*[.8,1,1.1,1.25,1.4][rar]);}
  if(rar>=2){const budget=Math.max(2,Math.round((ilvl*.55+1.5)*(rar===2?1:1.45)*(slot==='trinket'?1.2:1)));
    if(rar===2){const sfx=o.suffix||(o.cls?pick(CLASS_SFX[cls]):pick(Object.keys(SUFFIX)));const [a,b]=SUFFIX[sfx][1];const x=Math.ceil(budget/2);
      it.stats[a]=x;it.stats[b]=(it.stats[b]||0)+Math.max(1,budget-x);it.name=`${base} of the ${SUFFIX[sfx][0]}`;}
    else{const pr=PRIMARY[cls];it.stats[pr[0]]=Math.ceil(budget*.45);it.stats.sta=Math.ceil(budget*.35);it.stats[pr[1]]=(it.stats[pr[1]]||0)+Math.max(1,Math.round(budget*.25));it.name=o.name||`${pick(BLUE_PRE)} ${base}`;}
  }else it.name=o.name||base;
  it.value=Math.max(1,Math.round(Math.pow(ilvl+2,1.7)*[1,2,5,12,30][it.rar]*(slot==='weapon'?1.4:1)));
  return it;
}
function genJunk(lvl,kind){const name=pick(JUNK[kind]||JUNK.beast);if(name==='Moldy Bread')return genFood('bread',lvl);return {id:uid(),junk:true,rar:0,name,value:Math.max(1,Math.round((lvl+1)*rint(3,9)))};}
function genFood(diet,lvl){return {id:uid(),food:true,diet,rar:1,name:diet==='bread'?'Moldy Bread':pick(['Stringy Meat','Tough Jerky','Gamey Haunch']),value:Math.max(1,Math.round((lvl+1)*2))};}
function canEquip(it){if(!it||it.junk)return false;const K=CLASSES[H().cls];
  if(it.slot==='weapon')return K.weap.includes(it.wtype);if(it.slot==='offhand')return K.off===it.otype;if(it.slot==='trinket')return true;return K.armor.includes(it.atype);}
function score(it){if(!it||it.junk||!canEquip(it))return -1;const w=CLASSES[H().cls].w;let s=0;for(const k in it.stats)s+=(w[k]||0)*it.stats[k];
  s+=(it.armor||0)*w.armor;if(it.slot==='weapon')s+=((it.wmin+it.wmax)/2/it.speed)*w.dps;if(it.dur<=0)s*=.2;return s+it.ilvl*.01;}

function hubName(){const z=ZONES[H().zone];return typeof z.hub==='string'?z.hub:z.hub[H().faction];}
function giver(q){return Array.isArray(q.giver)?q.giver[H().faction==='concord'?0:1]:q.giver;}
function goTown(){if(H().dun){err('Leave the dungeon first.');return;}if(C.phase==='fight'){err("You can't leave in the middle of a fight.");return;}C.phase='town';C.t=travel(10);C.mob=null;line('Heading back to town.','l-sys');}
function leaveTown(){C.phase='seek';C.t=travel(6);line('You head back out.','l-sys');restoreFieldLoot();}

/* ---- items & vendor ---- */
function equip(id,auto){const h=H(),i=h.bags.findIndex(x=>x.id===id);if(i<0)return;const it=h.bags[i];if(!canEquip(it)){err("You can't use that.");return;}
  const old=h.gear[it.slot];h.bags.splice(i,1);h.gear[it.slot]=it;if(old)h.bags.push(old);h.stats.equips+=auto?0:1;recalc();
  line(`You equip [${it.name}].`,'l-loot');}
function autoEquip(it){if(score(it)>score(H().gear[it.slot]))equip(it.id,true);}
function inTown(){return C.phase==='intown';}
function sellItem(id){if(!inTown()){err('You need to be at a vendor in town.');return;}const h=H(),i=h.bags.findIndex(x=>x.id===id);if(i<0)return;const it=h.bags[i];h.bags.splice(i,1);h.money+=it.value;if(it.junk)h.stats.junkSold++;line(`Sold [${it.name}] for ${moneyTxt(it.value)}.`,'l-loot');}
function sellJunk(auto){const h=H();let n=0,v=0;h.bags=h.bags.filter(it=>{if(it.junk){n++;v+=it.value;return false;}return true;});h.money+=v;if(!auto)h.stats.junkSold+=n;if(n)line(`${auto?'Vendor Sweep sold':'Sold'} ${n} junk item${n>1?'s':''} for ${moneyTxt(v)}.`,'l-loot');}
function repairCost(){const h=H();let c=0;for(const s of SLOTS){const it=h.gear[s];if(it)c+=Math.round(it.value*.12*(100-it.dur)/100);}return c;}
function repairAll(auto){const h=H(),c=repairCost();if(!c)return;if(h.money<c){if(!auto)err("You can't afford that.");return;}h.money-=c;for(const s of SLOTS)if(h.gear[s])h.gear[s].dur=100;recalc();line(`Repaired your gear for ${moneyTxt(c)}.`,'l-loot');}
function meatCost(){return Math.max(5,H().lvl*6);}
function buyFood(auto){const h=H(),c=meatCost()*5;if(!inTown()){if(!auto)err('You need to be at a vendor in town.');return;}if(h.money<c){if(!auto)err("You can't afford that.");return;}
  if(h.bags.length>11){if(!auto)err('Not enough bag space.');return;}h.money-=c;
  for(let i=0;i<5;i++)h.bags.push({id:uid(),food:true,diet:'meat',rar:1,name:'Haunch of Meat',value:Math.round(meatCost()/4)});line(`Bought 5 Haunch of Meat for ${moneyTxt(c)}.`,'l-loot');}

/* ---- quests ---- */
function qState(q){const h=H();if(h.quests.done[q.id])return 'done';
  if(q.needDun&&q.needDun.some(id=>dungeonStats(id).clears<=0))return 'locked';
  if(h.quests.active.includes(q.id))return (h.quests.prog[q.id]||0)>=q.n?'ready':'active';
  if(h.lvl>=q.lvl-2&&(!q.req||h.quests.done[q.req]))return 'avail';return 'locked';}
function qReward(q){const h=H();if(!h.quests.rewards[q.id]){const s1=pick(['head','chest','legs','feet','hands','weapon']);let s2=pick(['head','chest','legs','feet','hands','offhand']);if(s2===s1)s2='trinket';
    h.quests.rewards[q.id]=q.elite?[genItem(q.lvl+2,3,s1,{cls:h.cls}),genItem(q.lvl+2,3,s2==='trinket'?'trinket':s2,{cls:h.cls})]:[genItem(q.lvl+1,2,s1,{cls:h.cls}),genItem(q.lvl+1,2,s2,{cls:h.cls})];}
  return h.quests.rewards[q.id];}
function qXP(q){return Math.round(Math.max(xpNeed(q.lvl)*.18,(q.lvl*5+45)*(4+q.n*.5))*(q.elite?2:1)*(RACES[H().race].qxp||1));}
function qMoney(q){return Math.round((q.lvl*45+20)*(q.elite?3:1));}
function accept(id){const h=H(),q=ALLQ[id];if(qState(q)!=='avail')return;if(h.quests.active.length>=3){err('Your quest log is full (3).');return;}h.quests.active.push(id);h.quests.prog[id]=0;qReward(q);line(`Quest accepted: ${q.name}`,'l-sys');}
function abandon(id){const h=H();h.quests.active=h.quests.active.filter(x=>x!==id);delete h.quests.prog[id];}
function turnIn(id,choice,auto){const h=H(),q=ALLQ[id];if(qState(q)!=='ready')return;const rw=qReward(q)[choice];
  if(rw&&h.bags.length>=16){err('Inventory is full.');return;}
  h.quests.active=h.quests.active.filter(x=>x!==id);h.quests.done[id]=true;h.stats.quests++;sfx('quest');guildXP(10);
  h.money+=qMoney(q);line(`${q.name} completed. You receive ${moneyTxt(qMoney(q))}. ${giver(q)}: "${Array.isArray(q.done)?q.done[h.faction==='concord'?0:1]:q.done}"`,'l-sys');gainXP(qXP(q),false);
  if(rw){h.bags.push(rw);line(`You receive [${rw.name}].`,'l-loot');if(h.addons.unl.gearcmp&&h.addons.on.gearcmp)autoEquip(rw);}
  toast(`Quest complete: ${q.name}`);slog(`Completed ${q.name}.`);
  if(q.id==='f10'){toast('The Drowned Sanctum awaits. Find a group in the Friends tab.');slog('Defeated the Drowned Prophet. The Drowned Sanctum awaits.');}
}
function questHelper(){if(RTALK)return;const h=H();
  for(const id of [...h.quests.active]){const q=ALLQ[id];if(qState(q)==='ready'){const rw=qReward(q);const c=score(rw[0])>=score(rw[1])?0:1;turnIn(id,c,true);}}
  if(h.quests.active.length<3){for(const z of ZONE_ORDER[h.faction]){for(const q of QUESTS[z]){if(h.quests.active.length>=3)break;if(z!==h.zone)continue;if(qState(q)==='avail'&&q.lvl<=h.lvl+1&&!(q.elite&&q.lvl>h.lvl))accept(q.id);}}}
}

/* ---- addons ---- */
const ADDONS=[
  {id:'autoloot',name:'AutoLoot',desc:'Loots every corpse for you, items included.',req:'Loot 60 corpses by hand',prog:()=>[H().stats.loots,60]},
  {id:'sweep',name:'Vendor Sweep',desc:'Sells junk whenever you reach a vendor, and sends you to town when your bags fill up.',req:'Sell 40 junk items by hand',prog:()=>[H().stats.junkSold,40]},
  {id:'questhelper',name:'QuestHelper',desc:'Turns in finished quests, picks the better reward, and accepts the next quests in your zone.',req:'Complete 12 quests',prog:()=>[H().stats.quests,12]},
  {id:'gearcmp',name:'GearCompare',desc:'Equips upgrades automatically when you pick them up.',req:'Equip 12 items by hand',prog:()=>[H().stats.equips,12]},
  {id:'macro',name:'Rotation Macro',desc:'Makes Auto mode play your action bar better. Rank 2 at 2,000 presses, rank 3 at 6,000 (catches openings half the time).',req:'Press 500 abilities yourself',prog:()=>[H().stats.manual,500]},
  {id:'petcare',cls:'hunter',name:'PetCare',desc:'Feeds your pet when it gets hungry, and buys meat when you visit town.',req:'Feed your pet 20 times by hand',prog:()=>[H().stats.feeds,20]},
  {id:'lfg',name:'LFG Tool',desc:'Re-runs your chosen dungeon with the same group as soon as you clear it.',req:'Clear dungeons 3 times',prog:()=>[H().dstats.clears,3]},
];
function checkAddons(){const h=H();for(const a of ADDONS){if(h.addons.unl[a.id]||(a.cls&&a.cls!==h.cls))continue;const [x,n]=a.prog();if(x>=n){h.addons.unl[a.id]=true;h.addons.on[a.id]=true;h.seenAddons=false;toast(`Addon installed: ${a.name}`);slog(`Earned the ${a.name} addon.`);line(`Addon installed: ${a.name}.`,'l-sys');}}}

