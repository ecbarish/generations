'use strict';
/* ---- tabs ---- */
let curKey=null;
const TABS={
quests:{
  key(){const h=H();return h.zone+'|'+h.grind+'|'+h.lvl+'|'+h.quests.active.join(',')+'|'+Object.keys(h.quests.done).length+'|'+Object.values(h.drecords||{}).map(r=>r.clears>0?1:0).join('')+'|'+h.quests.active.map(id=>qState(ALLQ[id])).join('');},
  build(){const h=H();const z=ZONES[h.zone];
    const route=ZONE_ORDER[h.faction],next=route.slice(route.indexOf(h.zone)+1).find(id=>h.lvl>=ZONES[id].lv[0]-2);
    const act=h.quests.active.map(id=>ALLQ[id]);const avail=QUESTS[h.zone].filter(q=>qState(q)==='avail');
    let o=`<h3>Quest log ${act.length}/3</h3><p class="sub">Quests give the most experience. Your hero hunts whatever the first unfinished quest needs.</p>`;
    if(h.zone==='thornvale'){
      o+='<section class="thornvale-requests" aria-label="Requests on this road"><p class="sub">Carry up to three requests. The two mine requests progress together; choose which unfinished request to follow next.</p>';
      o+=act.filter(q=>q.zone==='thornvale').map(q=>`<div class="rowl"><div class="l"><b>${q.name}</b><div class="meta" id="qshort-${q.id}"></div></div><button class="btn sm alt" data-act="followquest" data-arg="${q.id}" ${qState(q)!=='active'?'disabled':''}>${qState(q)==='ready'?'Ready to return':!h.grind&&act.find(a=>a.zone===h.zone&&qState(a)==='active')===q?'Following':'Follow next'}</button></div>`).join('');
      o+='</section>';
    }
    o+=act.length?act.map(q=>{const st=qState(q),rw=qReward(q);return `<div class="rowl" style="align-items:flex-start"><div class="l"><div class="qtitle ${st==='ready'?'done':''}">${q.name}${q.elite?' <span class="pill" style="color:var(--gold)">Elite</span>':''}</div>
      <div class="prog" id="qp-${q.id}"></div><div class="meta">${giver(q)} · ${ZONES[q.zone].name} · ${moneyStr(qMoney(q))} · ${fmtI(qXP(q))} XP</div>
      ${st==='ready'?`<div class="meta" style="margin-top:4px">${townActive()?'Choose a reward:':'Rewards to choose in town:'}</div>${rw.map((it,i)=>`<div style="margin-top:3px"><button class="btn sm" data-act="turnin" data-arg="${q.id}:${i}">${townActive()?'Return to':'Meet'} ${giver(q)}</button> ${itemSpan(it)}</div>`).join('')}`:`<div class="meta">Reward choice: ${rw.map(itemSpan).join(' or ')}</div>`}</div>
      <div class="r">${st!=='ready'?`<button class="btn sm alt" data-act="abandon" data-arg="${q.id}">Abandon</button>`:''}</div></div>`;}).join(''):'<p class="meta">No requests in your Journal yet. Meet the people below in town.</p>';
    o+=`<h4>Available at ${hubName()}</h4>${act.length>=3?'<p class="meta">Your three places are full. Finish or abandon a request before accepting another.</p>':''}`;
    o+=avail.length?avail.map(q=>`<div class="rowl" style="align-items:flex-start"><div class="l"><div class="qtitle">[${q.lvl}] ${q.name}${q.elite?' <span class="pill" style="color:var(--gold)">Elite</span>':''}</div><div class="qtext">"${q.text}"</div><div class="meta">${giver(q)} · ${q.type==='kill'?`Slay ${q.n} ${ZONES[q.zone].mobs.find(m=>m.id===q.mob).name}`:`Collect ${q.n} ${ZONES[q.zone].mobs.find(m=>m.id===q.mob).drop}`}</div></div>
      <div class="r"><button class="btn sm" data-act="accept" data-arg="${q.id}" ${act.length>=3?'disabled':''}>Meet ${giver(q)}</button></div></div>`).join(''):`<p class="meta">No more quests here at your level.${next?' '+ZONES[next].name+' has work for you.':''}</p>`;
    // attunement quests waiting on dungeon clears say what they need (T23's needDun)
    const waiting=QUESTS[h.zone].filter(q=>q.needDun&&!h.quests.done[q.id]&&h.lvl>=q.lvl-2&&(!q.req||h.quests.done[q.req])&&q.needDun.some(id=>dungeonStats(id).clears<=0));
    if(waiting.length)o+=waiting.map(q=>`<div class="rowl"><div class="l"><div class="qtitle">[${q.lvl}] ${q.name} <span class="pill" style="color:var(--gold)">Attunement</span></div><div class="meta">${giver(q)} will offer this once you have cleared ${q.needDun.filter(id=>dungeonStats(id).clears<=0).map(id=>DUNGEONS[id].name).join(' and ')} at least once.</div></div></div>`).join('');
    const nDone=QUESTS[h.zone].filter(q=>h.quests.done[q.id]).length;o+=`<p class="meta" style="margin-top:8px">${nDone}/${QUESTS[h.zone].length} quests done in ${z.name}.</p>`;
    return o;},
  update(){const h=H();for(const id of h.quests.active){const el=$('#qp-'+id);if(!el)continue;const q=ALLQ[id],p=h.quests.prog[id]||0,mob=ZONES[q.zone].mobs.find(m=>m.id===q.mob);
    el.textContent=q.type==='kill'?`${mob.name} slain: ${Math.min(p,q.n)}/${q.n}`:`${mob.drop}: ${Math.min(p,q.n)}/${q.n}`;const short=$('#qshort-'+id);if(short)short.textContent=el.textContent;}}
},
char:{
  key(){const h=H();return h.lvl+'|'+SLOTS.map(s=>h.gear[s]?h.gear[s].id+':'+h.gear[s].dur:'').join(',');},
  build(){const h=H();
    let o=`<h3>${h.name}</h3><p class="sub">Level ${h.lvl} ${RACES[h.race].name} ${CLASSES[h.cls].name} of ${FACTIONS[h.faction].name}. ${RACES[h.race].bonus}</p>`;
    o+=SLOTS.map(s=>{const it=h.gear[s];return `<div class="slotrow"><span class="sl">${s==='offhand'?'Off hand':s}</span><span>${it?itemSpan(it):'<span class="meta">Empty</span>'}</span><span class="meta">${it&&!it.junk?(it.dur<100?`<span style="color:${it.dur<30?'#ff6a5a':'var(--muted)'}">${it.dur}%</span>`:''):''}</span></div>`;}).join('');
    o+=`<h4>Attributes</h4><div class="stats" id="cstats"></div>`;
    return o;},
  update(){const s=ST,h=H();const rows=[['Health',s.hpMax],[CLASSES[h.cls].res==='mana'?'Mana':CLASSES[h.cls].res==='rage'?'Rage':'Energy',s.resMax],['Strength',s.st.str],['Agility',s.st.agi],['Intellect',s.st.int],['Stamina',s.st.sta],['Spirit',s.st.spi],['Armor',s.armor],
    [s.melee?'Attack power':'Spell power',Math.round(s.melee?s.ap:s.sp)],['Crit chance',s.crit.toFixed(1)+'%'],['Dodge',s.dodge.toFixed(1)+'%'],['Weapon',`${s.w.min}-${s.w.max} / ${s.w.speed.toFixed(1)}s`]];
    const html=rows.map(([k,v])=>`<div><span class="meta">${k}</span><b class="num">${v}</b></div>`).join('');const el=$('#cstats');if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html;}}
},
bags:{
  key(){const h=H();return h.bags.map(i=>i.id).join(',')+'|'+inTown()+'|'+bank().kit+canRepair()+'|'+SLOTS.map(s=>h.gear[s]?h.gear[s].id:'').join(',');},
  build(){const h=H();const town=inTown();
    let o=`<h3>Bags ${h.bags.length}/16</h3><p class="sub">${town?`You're at the vendor in ${hubName()}.`:'Sell and repair at a vendor in town. Full bags mean loot gets left behind.'}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${town?`<button class="btn sm" data-act="selljunk">Sell junk</button><button class="btn sm" data-act="repair" id="repBtn">Repair</button>${h.cls==='hunter'?`<button class="btn sm" data-act="buyfood">Buy 5 meat (${moneyTxt(meatCost()*5)})</button>`:''}<button class="btn sm alt" data-act="leavetown">Head back out</button>`:`<button class="btn sm" data-act="town">Go to town</button>`}${bank().kit&&canRepair()?`<button class="btn sm alt" data-act="usekit">Use a repair kit (${bank().kit})</button>`:''}</div>`;
    const pet=petOf();
    o+=h.bags.length?h.bags.map(it=>{const can=canEquip(it);const up=can&&score(it)>score(h.gear[it.slot]);
      const eats=it.food&&pet&&(FAMILIES[pet.family].diet==='any'||it.diet===FAMILIES[pet.family].diet);
      return `<div class="rowl"><div class="l">${itemSpan(it)} ${up?'<span class="pill" style="color:#7cf08a">Upgrade</span>':''}<div class="meta">${it.junk?'Junk':it.food?'Pet food':it.mountItem?'Mount':`${it.slot==='offhand'?'Off hand':it.slot} · item level ${it.ilvl}`} · ${moneyStr(it.value)}</div></div>
      <div class="r">${it.mountItem?`<button class="btn sm" data-act="learnmount" data-arg="${it.id}">Learn mount</button>`:''}${can?`<button class="btn sm" data-act="equip" data-arg="${it.id}">Equip</button>`:''}${eats?`<button class="btn sm" data-act="feed" data-arg="${it.id}">Feed ${pet.name}</button>`:''}${town?`<button class="btn sm alt" data-act="sell" data-arg="${it.id}">Sell</button>`:''}</div></div>`;}).join(''):'<p class="meta">Your bags are empty.</p>';
    return o;},
  update(){const b=$('#repBtn');if(b){const c=repairCost();b.innerHTML=c?`Repair (${moneyTxt(c)})`:'Nothing to repair';b.disabled=!c||H().money<c;}}
},
friends:{
  key(){const h=H();return h.party.join(',')+'|'+raidKey(h)+(h.raidLock?h.raidLock.killed.length:0)+S.chars.length+'|'+(h.npcs||[]).filter(n=>n.met).map(n=>n.id+':'+affLvl(n)+':'+npcLvl(n)).join(',')+'|'+!!h.dun+'|'+h.zone+'|'+h.lvl+'|'+h.dstats.clears+'|'+raidCandidates().map(n=>n.id+':'+npcLvl(n)+':'+roleOf(n)).join(',');},
  build(){const h=H();const met=(h.npcs||[]).filter(n=>n.met).sort((a,b)=>b.aff-a.aff);const unmet=(h.npcs||[]).length-met.length;
    let o=`<h3>Friends</h3><p class="sub">Adventurers wander the world beside you. Meet them on the road, group up, and they'll remember you. Friends unlock combined abilities in a fight.</p>`;
    o+=`<h4>Party ${h.party.length}/${h.dun&&h.dun.raid?9:4}</h4>`;
    o+=h.party.length?h.party.map(id=>{const n=npcOf(id);if(!n)return '';const al=affLvl(n);return `<div class="rowl"><div class="l"><b style="color:${CLASSES[n.cls].col}">${n.name}</b> <span class="meta">${ROLE_NAME[roleOf(n)]} · level ${npcLvl(n)}${n.guildKey ? ' · guild adventurer' : ''}</span>
      <div class="meta">${AFFINITY[al].n}${al>=2?` · Combo: <b>${COMBO[n.cls].name}</b>`:` · combos unlock at Friend`}</div></div>
      <div class="r">${h.dun?'':`<button class="btn sm alt" data-act="kick" data-arg="${id}">Part ways</button>`}</div></div>`;}).join(''):'<p class="meta">Nobody with you. Invite people you meet on the road, or friends from the list below.</p>';
    // Each dungeon has its own Heroic progression.
    o+=`<h4>Dungeons</h4>`;
    if(h.dun)o+=`<p class="meta">Inside ${dungeonDef().name}${h.dun.tier?` on Heroic ${h.dun.tier}`:''}. <button class="btn sm alt" data-act="leavedun">Leave dungeon</button></p>`;
    else for(const [id,def] of Object.entries(DUNGEONS)){const ok=h.lvl>=def.minLvl,here=h.zone===def.zone,r=dungeonStats(id);
      o+=`<h4>${def.name}</h4><p class="meta">Four packs and three bosses · level ${def.minLvl}+. ${def.waveName} hits the party; press D to dodge ${def.surgeName}. Each clear unlocks the next Heroic tier.</p>
        <p class="meta">Cleared ${r.clears} times${r.best>=0?` · best: ${r.best?'Heroic '+r.best:'Normal'}`:''}</p>
        <button class="btn" data-act="lfg" data-arg="${id}" ${ok&&here?'':'disabled'}>Find a group</button> ${!ok?`<span class="meta">Needs level ${def.minLvl}.</span>`:!here?`<span class="meta">Travel to ${ZONES[def.zone].name} first.</span>`:''}`;}
    if(!h.dun)o+=raidSection();
    // people
    o+=`<h4>People you've met (${met.length})</h4>`;
    o+=met.length?met.map(n=>{const al=affLvl(n),nx=AFFINITY[al+1],inP=h.party.includes(n.id);return `<div class="rowl" style="align-items:flex-start"><div class="l"><b style="color:${CLASSES[n.cls].col}">${n.name}</b>
      <span class="meta">level ${npcLvl(n)} ${RACES[n.race].name} ${CLASSES[n.cls].name} · ${PERSONALITY[n.pers].name} · now in ${ZONES[npcZone(n)].name}</span>
      <div class="meta"><b>${AFFINITY[al].n}</b>${nx?` (${Math.floor(n.aff)} / ${nx.at})`:''}</div><div class="aff"><i style="width:${nx?(n.aff-AFFINITY[al].at)/(nx.at-AFFINITY[al].at)*100:100}%"></i></div>
      ${n.notes&&n.notes.length?`<div class="meta" style="font-style:italic">${n.notes[0]}</div>`:''}</div>
      <div class="r">${inP?'<span class="pill" style="color:#7cf08a">In party</span>':(al>=1&&!h.dun?`<button class="btn sm" data-act="invite" data-arg="${n.id}" ${h.party.length>=4||Math.abs(npcLvl(n)-h.lvl)>4?'disabled':''}>Invite</button>`:'')}</div></div>`;}).join(''):'<p class="meta">No one yet. Keep an eye out on the road.</p>';
    if(unmet)o+=`<p class="meta" style="margin-top:6px">${unmet} more adventurer${unmet>1?'s':''} roam the world. You'll run into them as you travel.</p>`;
    return o;},
  update(){}
},
mounts:{
  key(){const h=H(),p=petOf();return h.riding+'|'+h.mount+'|'+(h.mounts||[]).map(m=>m.id).join(',')+'|'+inTown()+'|'+h.lvl+'|'+(p?p.id+':'+!!p.mountTrained+':'+bondLvl(p):'');},
  build(){const h=H(),town=inTown(),am=activeMount(),p=petOf();
    let o=`<h3>Mounts</h3><p class="sub">Mounts carry you between fights, to town and across zones faster. Every mount gets better the more you ride it.</p>`;
    o+=`<div class="petcard"><canvas width="96" height="72" data-mountart="1"></canvas><div style="min-width:0">`;
    if(am)o+=`<div class="petname r${am.rar}">${am.name}</div><div class="meta">${Math.round(mountSpeed(am)*100)}% travel speed${am.base>RIDING[h.riding].cap?` (held back by ${RIDING[h.riding].n}: learn ${RIDING[2].n} for full speed)`:''}</div>
      <div class="meta" style="margin-top:6px">Training: <b id="mtLvl"></b></div><div class="mini"><i id="mtBar" style="background:#3a8bff"></i></div>
      <div class="meta">${MOUNT_TRAIN.map(t=>t.n).join(' → ')}: each step adds 5% speed. You train a mount by riding it.</div>`;
    else o+=`<div class="petname">On foot</div><div class="meta">${!h.riding?`You need riding training first. ${RIDING[1].n} is available at level ${RIDING[1].lvl} from the riding trainer in town.`:'Choose a mount below.'}</div>`;
    o+=`</div></div>`;
    // riding skill
    o+=`<h4>Riding skill: ${RIDING[h.riding].n}</h4>`;
    const next=RIDING[h.riding+1];
    o+=next?`<div class="rowl"><div class="l"><b>${next.n}</b><div class="meta">Level ${next.lvl} · mounts up to ${Math.round(next.cap*100)}% speed · ${moneyStr(next.cost)}</div></div>
      <div class="r"><button class="btn sm" data-act="buyriding" ${town&&h.lvl>=next.lvl&&h.money>=next.cost?'':'disabled'} title="${town?'':'Visit the riding trainer in town'}">${town?'Train':'In town'}</button></div></div>`:'<p class="meta">You have mastered every riding skill in this version.</p>';
    // collection
    const own=(h.mounts||[]).slice();const petm=p&&p.mountTrained?petMountObj(p):null;
    o+=`<h4>Your mounts</h4>`;
    const rows=[...(petm?[petm]:[]),...own];
    o+=rows.length?rows.map(m=>`<div class="rowl"><div class="l"><b class="r${m.rar}">${m.name}</b>${m.pet?' <span class="pill" style="color:var(--q2)">Your pet</span>':''}<div class="meta">${m.kind[0].toUpperCase()+m.kind.slice(1)} · ${Math.round(m.base*100)}% base · ${MOUNT_TRAIN[trainLvl(m.xp||0)].n}</div></div>
      <div class="r">${(h.mount===m.id)?'<span class="pill" style="color:#7cf08a">Riding</span>':`<button class="btn sm" data-act="ride" data-arg="${m.id}" ${h.riding?'':'disabled'}>Ride</button>`}</div></div>`).join(''):'<p class="meta">No mounts yet.</p>';
    // vendor
    o+=`<h4>Mount vendor · ${FACTIONS[h.faction].name}</h4>`;
    o+=MOUNT_SHOP[h.faction].map(s=>{const owned=own.some(m=>m.key===s.key);return `<div class="rowl"><div class="l"><b class="r${s.rar}">${s.name}</b><div class="meta">Level ${s.lvl} · ${Math.round(s.base*100)}% speed · ${moneyStr(s.cost)}</div></div>
      <div class="r">${owned?'<span class="pill" style="color:var(--muted)">Owned</span>':`<button class="btn sm" data-act="buymount" data-arg="${s.key}" ${town&&h.lvl>=s.lvl&&h.money>=s.cost&&h.riding?'':'disabled'}>${town?'Buy':'In town'}</button>`}</div></div>`;}).join('');
    // hunter pet mounts
    if(h.cls==='hunter'){o+=`<h4>Ride your pet</h4>`;
      if(!p)o+='<p class="meta">Tame a pet first.</p>';
      else if(p.mountTrained)o+=`<p class="meta">${p.name} is trained to carry you. Rarity sets its speed: ${RARITY.slice(0,5).map((r,i)=>`${r.name} ${Math.round(PET_MOUNT_SPEED[i]*100)}%`).join(', ')}.</p>`;
      else{const okFam=MOUNTABLE.includes(p.family),okBond=bondLvl(p)>=3,okLvl=p.lvl>=10,okRide=h.riding>=1;
        o+=`<div class="rowl"><div class="l"><b>Train ${p.name} as a mount</b><div class="meta">${okFam?'✓':'✗'} ${FAMILIES[p.family].pl} can carry a rider${okFam?'':' (spiders cannot)'} · ${okBond?'✓':'✗'} Devoted bond · ${okLvl?'✓':'✗'} Pet level 10 · ${okRide?'✓':'✗'} ${RIDING[1].n} · ${moneyStr(PET_MOUNT_COST)}</div></div>
          <div class="r"><button class="btn sm" data-act="trainpet" ${okFam&&okBond&&okLvl&&okRide&&town&&h.money>=PET_MOUNT_COST?'':'disabled'}>${town?'Train':'In town'}</button></div></div>`;}}
    o+=`<p class="meta" style="margin-top:8px">Rumor has it the legendary beasts of each zone sometimes leave their reins behind.</p>`;
    return o;},
  update(){const am=activeMount();if(am&&$('#mtLvl')){const l=trainLvl(am.xp||0),nx=MOUNT_TRAIN[l+1];$('#mtLvl').textContent=nx?`${MOUNT_TRAIN[l].n} (${fmtTime(am.xp||0)} / ${fmtTime(nx.at)} ridden)`:`${MOUNT_TRAIN[l].n} (max)`;
      $('#mtBar').style.width=(nx?((am.xp||0)-MOUNT_TRAIN[l].at)/(nx.at-MOUNT_TRAIN[l].at)*100:100)+'%';}
    const cv=document.querySelector('[data-mountart]');if(cv&&cv.dataset.drawn!==String(am?am.id:'none')){cv.dataset.drawn=String(am?am.id:'none');const c=cv.getContext('2d');c.clearRect(0,0,96,72);c.imageSmoothingEnabled=false;
      if(am)drawBeast(c,am.kind==='horse'?32:30,am.kind==='horse'?6:16,am.kind==='horse'?4:4,am.col,am.kind,false,0);else{c.fillStyle='#6f6452';c.font='28px serif';c.fillText('–',40,44);}}}
},
pets:{
  key(){const h=H();return (h.pets||[]).map(p=>p.id+':'+p.lvl+':'+bondLvl(p)+':'+p.name).join(',')+'|'+h.activePet+'|'+inTown();},
  build(){const h=H(),p=petOf(),town=inTown();
    let o=`<h3>Pets</h3><p class="sub">Tame a beast your level or lower: start a fight with it, then press <b>Tame Beast</b> and survive 6 seconds. Rarer beasts make stronger pets with more traits. Your bond grows with every fight you win together, as long as your pet is fed.</p>`;
    if(p){const F=FAMILIES[p.family];
      o+=`<div class="petcard"><canvas width="96" height="72" data-petart="${p.id}"></canvas><div style="min-width:0">
        <div class="petname r${p.rar}">${p.name}</div>
        <div class="meta"><span class="r${p.rar}">${RARITY[p.rar].name}</span> ${F.name} · ${F.role} · level ${p.lvl}${p.species!==p.name?` · ${p.species}`:''} · tamed in ${p.tamedIn}</div>
        <div class="meta" style="margin-top:6px">Health <span id="ptHpT"></span></div><div class="mini"><i id="ptHp" style="background:#2fbf3b"></i></div>
        <div class="meta">Mood: <b id="ptMood"></b></div><div class="mini"><i id="ptHappy" style="background:#f2c14e"></i></div>
        <div class="meta">Bond: <b id="ptBond"></b></div><div class="mini"><i id="ptBondI" style="background:#b55cf0"></i></div>
        <div class="meta"><b>${F.abName}</b>: ${F.abDesc}</div>
        ${p.traits.length?`<div class="traits">${p.traits.map(t=>`<span class="trait" title="${TRAITS[t].desc}">${TRAITS[t].name}</span>`).join('')}</div>`:'<div class="meta">No traits.</div>'}
        <div class="mfoot" style="justify-content:flex-start"><button class="btn sm" data-act="feed" id="feedBtn">Feed</button><button class="btn sm" data-act="revive" id="reviveBtn">Revive (4s)</button>
          <input class="petinp" id="petName" maxlength="18" value="${p.name}" aria-label="Pet name"><button class="btn sm alt" data-act="rename">Rename</button></div>
      </div></div>`;}
    else o+=`<p class="meta">${h.cls==='hunter'?'No pet yet. Find a beast your level or lower and tame it.':'Only Hunters can tame beasts for now.'}</p>`;
    const others=(h.pets||[]).filter(x=>x.id!==h.activePet);
    o+=`<h4>Stable ${(h.pets||[]).length}/3</h4>`;
    o+=others.length?others.map(x=>`<div class="rowl"><div class="l"><b class="r${x.rar}">${x.name}</b><div class="meta">${RARITY[x.rar].name} ${FAMILIES[x.family].name} · level ${x.lvl} · ${BOND[bondLvl(x)].n}${x.traits.length?' · '+x.traits.map(t=>TRAITS[t].name).join(', '):''}</div></div>
      <div class="r"><button class="btn sm" data-act="petactive" data-arg="${x.id}" ${town?'':'disabled title="Swap pets at the stable in town"'}>Make active</button><button class="btn sm alt" data-act="petrelease" data-arg="${x.id}">Release</button></div></div>`).join(''):'<p class="meta">No other pets. Swap pets at the stable in town.</p>';
    if(p)o+=`<div style="margin-top:6px"><button class="btn sm alt" data-act="petrelease" data-arg="${p.id}">Release ${p.name}</button></div>`;
    o+=`<h4>Rarity</h4><div class="rarlegend">${RARITY.map((r,i)=>`<span class="r${i}">${r.name}${i===5?' (hybrids, coming later)':''}</span>`).join('')}</div>
      <p class="meta" style="margin-top:6px">Bond: ${BOND.map(b=>b.n).join(' → ')}. Loyal unlocks Coordinated Strike. Devoted shortens your pet's ability cooldown. Bonded: your pet takes a killing blow for you once per fight.</p>
      <p class="meta">Pets tamed: ${h.stats.tamed||0}</p>`;
    return o;},
  update(){const p=petOf();if(!p||!$('#ptHp'))return;const ps=petStats(p);
    $('#ptHp').style.width=(p.hp/ps.hpMax*100)+'%';$('#ptHpT').textContent=p.hp>0?`${Math.ceil(p.hp)} / ${ps.hpMax}`:'Dead';
    $('#ptHappy').style.width=p.happy+'%';$('#ptMood').textContent=`${moodName(p)} (${Math.round(p.happy)})${p.happy>=70?': +15% damage, faster bond':p.happy<30?': -25% damage, bond stalls':''}`;
    const bl=bondLvl(p),nx=BOND[bl+1];$('#ptBond').textContent=nx?`${BOND[bl].n} (${Math.floor(p.bond)} / ${nx.at})`:`${BOND[bl].n} (max)`;$('#ptBondI').style.width=(nx?(p.bond-BOND[bl].at)/(nx.at-BOND[bl].at)*100:100)+'%';
    const fb=$('#feedBtn');const diet=FAMILIES[p.family].diet;const n=H().bags.filter(it=>it.food&&(diet==='any'||it.diet===diet)).length;fb.textContent=`Feed (${n} food)`;fb.disabled=!n;
    const rb=$('#reviveBtn');rb.hidden=p.hp>0;rb.disabled=C.phase==='fight'||C.reviving>0;
    const cv=document.querySelector('[data-petart]');if(cv&&!cv.dataset.drawn){cv.dataset.drawn=1;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;drawBeast(c,30,20,4,p.col,p.family,false,0);}}
},
talents:{
  key(){const h=H();return h.lvl+'|'+JSON.stringify(h.talents)+'|'+(h.respecs||0)+'|'+(h.money>=respecCost());},
  build(){const h=H(),pts=talentPoints(),spent=talentSpent(),role=heroRole(),cost=respecCost();
    let o=`<h3>Talents</h3><p class="sub">${h.lvl<10?'Talents unlock at level 10: one point per level after that.':`${pts} point${pts===1?'':'s'} to spend. ${spent} spent.`}
      Each tree's capstone needs 25 points in that tree, so you can only ever have one. Your role in groups follows the tree with the most points:
      <b>${ROLE_NAME[role]}</b>. Three trees and 51 points at level 60: pick a direction, or mix two.</p>`;
    o+=TALENTS[h.cls].map((tr,ti)=>{const tp=treePoints(ti);
      return `<h4>${tr.tree} <span class="meta">${ROLE_NAME[tr.role]} · ${tp} point${tp===1?'':'s'}</span></h4>`+tr.list.map(t=>{const r=h.talents[t.id]||0;const ok=pts>0&&r<t.max&&(!t.req||tp>=t.req);
        return `<div class="tal"><div><b>${t.name}</b> <span class="rank">${r}/${t.max}</span><div class="meta">${t.desc}</div></div><button class="btn sm" data-act="talent" data-arg="${t.id}" ${ok?'':'disabled'}>Learn</button></div>`;}).join('');}).join('');
    o+=`<p class="meta" style="margin-top:8px"><button class="btn sm alt" data-act="resettal" ${spent&&h.money>=cost?'':'disabled'}>Reset talents</button> ${cost?`Costs ${moneyTxt(cost)}; the price drops a step for each day without a reset.`:h.lvl<40?'Free until level 40.':'Your first reset with the new trees is free.'}</p>`;
    return o;},
  update(){}
},
addons:{
  key(){const h=H();return ADDONS.map(a=>h.addons.unl[a.id]?1:0).join('')+macroRank();},
  build(){H().seenAddons=true;
    return `<h3>Addons</h3><p class="sub">Your automation. Each addon installs itself once you've done its job by hand enough times. Nothing here is bought.</p>`+
    ADDONS.filter(a=>!a.cls||a.cls===H().cls).map(a=>{const u=H().addons.unl[a.id];return `<div class="rowl"><div class="l"><b style="color:${u?'var(--gold)':'var(--muted)'}">${a.name}</b> ${a.id==='macro'&&u?`<span class="pill" style="color:#7cf08a">Rank ${macroRank()||1}</span>`:''}<div class="meta">${a.desc}</div>
      ${u?(a.id==='macro'?`<div class="meta" id="macroInfo"></div>`:''):`<div class="meta" id="ar-${a.id}"></div>`}</div>
      <div class="r">${u?`<button class="tgl" data-act="addon" data-arg="${a.id}" id="at-${a.id}" aria-label="${a.name} on or off"></button>`:''}</div></div>`;}).join('');},
  update(){const h=H();for(const a of ADDONS){const t=$('#at-'+a.id);if(t)t.setAttribute('aria-pressed',h.addons.on[a.id]?'true':'false');const r=$('#ar-'+a.id);if(r){const [x,n]=a.prog();r.textContent=`${a.req}: ${fmtI(Math.min(x,n))}/${n}`;}}
    const mi=$('#macroInfo');if(mi)mi.textContent=`Earned Auto repeats a cleared road at your level, or a road you have outgrown, at ${Math.round(aiEff()*100)}% efficiency. ${fmtI(h.stats.manual)} presses so far.`;}
},
journal:{
  key(){return 'j'+(H().pace||'classic')+!!H().dun;},
  build(){return `<h3>Journal</h3><p class="sub">Saves in this browser every 10 seconds. Export a backup now and then.</p><div class="stats" id="jstats"></div>
    <h4>Journey length</h4><p class="sub">How fast this hero levels. Change it any time outside a dungeon. Questing with companions shares kill experience, as in classic groups.</p><div class="choices">${Object.entries(PACE).map(([id,p])=>`<button class="choice ${(H().pace||"classic")===id?"on":""}" data-act="pace" data-arg="${id}" ${H().dun?"disabled":""}><b>${p.name}</b><span>${p.desc}</span></button>`).join("")}</div>
    <h4>Adventure log</h4><div id="jlog" class="meta"></div>
    <h4>Save</h4><textarea id="saveTxt" placeholder="Export puts your save here. Paste a save here to import it." aria-label="Save data"></textarea>
    <div class="mfoot" style="justify-content:flex-start"><button class="btn sm" data-act="export">Export</button><button class="btn sm" data-act="copy">Copy</button><button class="btn sm" data-act="import">Import pasted save</button><button class="btn sm alt" data-act="delete" id="delBtn">Delete character</button></div><p class="meta" id="saveMsg"></p>${Arcade.saveToolsHTML(KEY,'btn sm')}`;},
  update(){const h=H(),s=h.stats;const rows=[['Played',fmtTime(s.play)],['Monsters slain',fmtI(s.kills)],['Deaths',s.deaths],['Quests done',s.quests],['Gold earned',moneyTxt(s.money)],['Abilities pressed',fmtI(s.manual)]];
    const html=rows.map(([k,v])=>`<div><span class="meta">${k}</span><b class="num">${v}</b></div>`).join('');const el=$('#jstats');if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html;}
    const lg=(H().log||[]).slice(0,20).map(m=>`<div>${m}</div>`).join('');const jl=$('#jlog');if(jl.dataset.h!==lg){jl.innerHTML=lg||'Nothing yet.';jl.dataset.h=lg;}}
}};
function renderTab(force){const t=TABS[S.tab]||TABS.quests,k=S.tab+':'+t.key();if(force||k!==curKey){curKey=k;$('#tabbody').innerHTML=t.build();}t.update();
  document.querySelectorAll('.tabs [role=tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.arg===S.tab?'true':'false'));}
