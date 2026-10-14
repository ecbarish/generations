'use strict';
/* =================== UI =================== */
function toast(m,kind){const el=document.createElement('div');el.className='toast'+(kind?' '+kind:'');el.textContent=m;const b=$('#toasts');b.appendChild(el);while(b.children.length>4)b.firstChild.remove();setTimeout(()=>el.remove(),kind==='ding'?3200:2600);}
let modalKind=null;
function openModal(kind,html){modalKind=kind;$('#sheet').innerHTML=html;$('#modal').hidden=false;}
function closeModal(){modalKind=null;$('#modal').hidden=true;}

/* ---- tooltip ---- */
const itemIndex={};
function itemSpan(it){itemIndex[it.id]=it;return `<span class="item q${it.rar}" data-item="${it.id}">${it.name}</span>`;}
function tipHTML(it){
  let h=`<div class="tn q${it.rar}">${it.name}</div>`;
  if(it.junk)return h+`<div>Poor quality. Sell to a vendor.</div><div>Sell price: ${moneyStr(it.value)}</div>`;
  if(it.mountItem){const r=REINS[it.mid];return h+`<div>Mount: ${FAMILIES[r.kind]?FAMILIES[r.kind].name:"Horse"}, ${Math.round(r.base*100)}% base speed.</div><div>Use from your bags to add it to your mounts. Needs Journeyman Riding for full speed.</div>`;}
  if(it.food)return h+`<div>Pet food: ${it.diet==="bread"?"bread (boars eat anything)":"meat"}.</div><div>Feeding makes your pet happier.</div><div>Sell price: ${moneyStr(it.value)}</div>`;
  const slot=it.slot==='offhand'?(it.otype==='shield'?'Off hand · Shield':'Off hand · '+(it.otype==='tome'?'Held in off hand':'Dagger')):it.slot==='weapon'?`Main hand · ${it.wtype[0].toUpperCase()+it.wtype.slice(1)}`:it.slot==='trinket'?'Trinket':`${it.slot[0].toUpperCase()+it.slot.slice(1)} · ${it.atype[0].toUpperCase()+it.atype.slice(1)}`;
  h+=`<div>${slot}</div>`;
  if(it.slot==='weapon')h+=`<div>${it.wmin} - ${it.wmax} Damage · Speed ${it.speed.toFixed(2)}</div><div>(${((it.wmin+it.wmax)/2/it.speed).toFixed(1)} damage per second)</div>`;
  if(it.armor)h+=`<div>${it.armor} Armor</div>`;
  for(const k in it.stats)h+=`<div>+${it.stats[k]} ${STAT_NAME[k]}</div>`;
  h+=`<div class="${it.dur<=0?'down':''}">Durability ${it.dur}%${it.dur<=0?' (broken)':''}</div><div style="color:var(--gold)">Item level ${it.ilvl}</div>`;
  if(!canEquip(it))h+=`<div class="down">Your class can't use this.</div>`;
  else{const cur=H().gear[it.slot];if(cur&&cur.id!==it.id){const d=score(it)-score(cur);h+=`<div class="${d>=0?'up':'down'}">${d>=0?'Upgrade':'Downgrade'} over ${cur.name}</div>`;}else if(!cur)h+=`<div class="up">Empty slot: upgrade</div>`;}
  return h+`<div>Sell price: ${moneyStr(it.value)}</div>`;
}
document.addEventListener('mouseover',e=>{const el=e.target.closest('[data-item]');const tip=$('#tip');if(!el){tip.hidden=true;return;}const it=itemIndex[el.dataset.item];if(!it){tip.hidden=true;return;}
  tip.innerHTML=tipHTML(it);tip.hidden=false;const r=el.getBoundingClientRect();let x=r.right+10,y=r.top;if(x+300>innerWidth)x=Math.max(8,r.left-300);if(y+tip.offsetHeight>innerHeight)y=innerHeight-tip.offsetHeight-8;tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px';});

/* ---- world UI ---- */
let slotsKey='';
function buildSlots(){const b=bar();slotsKey=H().cls+H().lvl+JSON.stringify(H().talents);
  $('#slots').innerHTML=b.map((a,i)=>`<button class="ab" data-act="press" data-arg="${i}" id="ab-${i}" aria-label="${a.name}"><span class="key">${i+1}</span><span class="ic">${a.name}</span><span class="cd" id="abc-${i}"></span><span class="cdn" id="abn-${i}"></span></button>`).join('');
  b.forEach((a,i)=>{$('#ab-'+i).dataset.tipAb=i;});}
function updateWorld(){
  renderRoadGuide();
  const h=H(),K=CLASSES[h.cls],z=ZONES[h.zone];
  $('#who').innerHTML=`<span><span class="crest" style="background:${FACTIONS[h.faction].col}"></span>${FACTIONS[h.faction].name}</span><span>${moneyStr(h.money)}</span>`;
  $('#zoneName').textContent=z.name;$('#zoneSub').textContent=`Level ${z.lv[0]}–${z.lv[1]} · ${hubName()}${z.faction?'':' · Contested territory'}`;$('#zoneLore').textContent=z.lore||'';
  // zone buttons
  const zb=ZONE_ORDER[h.faction].map(id=>`<button class="btn sm ${id===h.zone?'':'alt'}" data-act="zone" data-arg="${id}" ${id===h.zone?'disabled':''}>${ZONES[id].name}</button>`).join('')+
    ` <select class="btn sm alt" id="grindSel" aria-label="Hunt target"><option value="">Hunt: follow quests</option>${z.mobs.filter(m=>!m.rare).map(m=>`<option value="${m.id}" ${h.grind===m.id?'selected':''}>Hunt: ${m.name} (${m.lv[0]}-${m.lv[1]})</option>`).join('')}</select>`;
  const d=h.dun;
  if(d){const bosses=dungeonDef().enc.slice(0,d.step).filter(e=>e.boss).length;$('#zoneName').textContent=dungeonDef().name+(d.tier?` · Heroic ${d.tier}`:'');
    $('#zoneLore').textContent='';$('#zoneSub').textContent=`Pull ${Math.min(d.step+1,dungeonDef().enc.length)} of ${dungeonDef().enc.length} · Bosses ${bosses}/${dungeonDef().enc.filter(e=>e.boss).length}${d.wipes?` · ${d.wipes} wipe${d.wipes>1?'s':''}`:''}${d.mods.length?' · '+d.mods.map(k=>DUN_MODS[k].name).join(', '):''}`;}
  const zk=d?'dun':h.zone+h.grind+h.faction;const zbEl=$('#zoneBtns');
  if(zbEl.dataset.k!==zk){zbEl.innerHTML=d?'<button class="btn sm alt" data-act="leavedun">Leave dungeon</button>':zb;zbEl.dataset.k=zk;}
  // player frame
  $('#pName').textContent=h.name;$('#pLvl').textContent=h.lvl;$('#pPort').firstChild.textContent=h.name[0];$('#pPort').style.borderColor=K.col;
  $('#pHp').style.width=(Math.max(0,C.hp)/ST.hpMax*100)+'%';$('#pHpT').textContent=`${Math.max(0,Math.ceil(C.hp))} / ${ST.hpMax}${C.chill?' · Grave Chill '+C.chill:''}`;
  const rb=$('#pResBar');rb.className='bar b-'+K.res;$('#pRes').style.width=(C.res/ST.resMax*100)+'%';$('#pResT').textContent=`${Math.floor(C.res)} / ${ST.resMax}`;
  const cps=$('#pCps');cps.hidden=h.cls!=='rogue';if(h.cls==='rogue')[...cps.children].forEach((b,i)=>b.classList.toggle('on',i<C.cp));
  // target frame
  const m=C.mob;
  if(m){const c=con(m.lvl);$('#tName').innerHTML=`<span style="color:var(--con-${c})">${m.name}</span>`;$('#tLvl').textContent=m.lvl;$('#tPort').firstChild.textContent=m.name[0];$('#tPort').classList.toggle('elite',m.elite);
    $('#tHp').style.width=Math.max(0,m.hp/m.max*100)+'%';$('#tHpT').textContent=`${Math.max(0,Math.ceil(m.hp))} / ${m.max}`;}
  else{$('#tName').textContent='No target';$('#tLvl').textContent='–';$('#tPort').firstChild.textContent='–';$('#tPort').classList.remove('elite');$('#tHp').style.width='0%';$('#tHpT').textContent='';}
  if(m&&m.kind==='beast'&&m.rar)$('#tName').innerHTML+=` <span class="r${m.rar}" style="font-size:12px">${RARITY[m.rar].name}</span>`;
  const cb=$('#castBar');const chan=C.cast||C.taming;cb.hidden=!chan;
  if(C.cast){$('#castI').style.width=((1-C.cast.t/C.cast.max)*100)+'%';$('#castT').textContent=C.cast.a.name;}
  else if(C.taming){$('#castI').style.width=((1-C.taming.t/C.taming.max)*100)+'%';$('#castT').textContent=`Taming ${m?m.name:''}`;}
  // hunter: tame button, pet frame, pets tab
  const hunter=h.cls==='hunter';$('#petsTab').hidden=!hunter;
  const tb2=$('#tameBtn');tb2.hidden=!(hunter&&canTame());if(!tb2.hidden){const why=tameBlock();tb2.disabled=!!why;tb2.title=why||'Channel for 6 seconds while the beast attacks you. If you survive, it is yours.';}
  const pet=petOf(),pf=$('#petframe');pf.hidden=!pet;
  if(pet){const ps=petStats(pet);$('#pfName').innerHTML=`<span class="r${pet.rar}">${pet.name}</span> <span class="meta">${pet.lvl} · ${BOND[bondLvl(pet)].n}</span>`;
    $('#pfHp').style.width=(Math.max(0,pet.hp)/ps.hpMax*100)+'%';$('#pfHpT').textContent=pet.hp>0?`${Math.ceil(pet.hp)} / ${ps.hpMax}`:(C.reviving>0?`Reviving… ${C.reviving.toFixed(1)}s`:'Dead');
    const md=$('#pfMood');md.textContent=moodName(pet);md.style.color=pet.happy>=70?'#7cf08a':pet.happy<30?'#ff6a5a':'var(--muted)';}
  $('#pBadge').hidden=!(pet&&(pet.happy<30||pet.hp<=0));
  // party frames
  const pfr=$('#partyframes');pfr.hidden=!C.party.length;
  if(C.party.length){const pk=C.party.map(p=>p.id).join(',');if(pfr.dataset.k!==pk){pfr.dataset.k=pk;
      pfr.innerHTML=C.party.map(p=>`<div class="pm" id="pm-${p.id}"><div class="pn"><span style="color:${CLASSES[p.n.cls].col}">${p.n.name}</span><span class="role">${ROLE_NAME[roleOf(p.n)]} · ${npcLvl(p.n)}</span></div><div class="bar b-hp"><i id="pmh-${p.id}"></i><span id="pmt-${p.id}"></span></div></div>`).join('');}
    for(const p of C.party){const mx=compStats(p.n).hpMax;document.getElementById('pm-'+p.id).classList.toggle('dead',p.dead);document.getElementById('pmh-'+p.id).style.width=(p.hp/mx*100)+'%';document.getElementById('pmt-'+p.id).textContent=p.dead?'Fallen':`${Math.ceil(p.hp)} / ${mx}${p.chill?' · Chill '+p.chill:''}`;}}
  // someone you meet on the road
  const ec=$('#enccard'),e=C.enc,en=e&&npcOf(e.id);ec.hidden=!en;
  if(en){const ek=e.id+e.kind+e.waved+h.party.length;if(ec.dataset.k!==ek){ec.dataset.k=ek;const K2=CLASSES[en.cls];
      const what={fighting:`is fighting for their life nearby`,resting:`is resting by a campfire`,questing:`is out questing`}[e.kind];
      $('#encText').innerHTML=`<b style="color:${K2.col}">${en.name}</b> <span class="meta">level ${npcLvl(en)} ${RACES[en.race].name} ${K2.name} · ${PERSONALITY[en.pers].name}${en.met?` · ${AFFINITY[affLvl(en)].n}`:''}</span><div class="meta">${what}.</div>`;
      $('#encActs').innerHTML=`${e.waved?'':'<button class="btn sm alt" data-act="encwave">Wave</button>'}${e.kind==='fighting'?'<button class="btn sm" data-act="enchelp">Help them</button>':''}<button class="btn sm" data-act="encinvite" ${h.party.length>=4?'disabled':''}>Invite to group</button>`;}}
  // combo + dodge
  const cbn=$('#comboBtn'),cp=C.party.find(x=>x.id===C.comboWith);cbn.hidden=!(C.win.combo>0&&cp&&!cp.dead&&C.phase==='fight');if(!cbn.hidden){$('#comboTxt').textContent=`${COMBO[cp.n.cls].name}`;cbn.title=`Combo with ${cp.n.name}: ${COMBO[cp.n.cls].desc}`;}
  $('#dodgeBtn').hidden=!(C.win.dodge>0&&C.surge);raidUI();
  // action bar
  const sk=h.cls+h.lvl+JSON.stringify(h.talents);if(sk!==slotsKey)buildSlots();
  bar().forEach((a,i)=>{const el=$('#ab-'+i);if(!el)return;const learned=knows(a.id);el.classList.toggle('locked',!learned);
    const cd=Math.max(C.gcd,a.cd?(C.cds[a.id]||0):0),max=a.cd&&C.cds[a.id]>C.gcd?a.cd:Math.max(1.5,C.cast?C.cast.max:1.5);
    $('#abc-'+i).style.setProperty('--p',(learned&&cd>0?cd/max*100:0)+'%');$('#abn-'+i).textContent=learned&&a.cd&&C.cds[a.id]>1.5?Math.ceil(C.cds[a.id]):'';
    el.classList.toggle('react',learned&&!!a.react&&C.win[a.react]>0&&C.phase==='fight');
    el.classList.toggle('nores',learned&&C.res<a.cost());
    el.title=`${a.name}${a.talent?' (talent)':` (level ${a.lvl})`}: ${a.desc}`;});
  // mode
  $('#mFocus').classList.toggle('on',h.mode==='focus');$('#mAuto').classList.toggle('on',h.mode==='auto');
  const eff=Math.round(aiEff()*100),wait=combatWaiting(),fb=$('#fightBtn');fb.hidden=!wait;fb.textContent=C.fightT>0?'Continue fight':'Fight';
  const auto=$('#mAuto');auto.hidden=false;auto.disabled=!autoAllowed();auto.title=autoAllowed()?'Earned help. Auto repeats this road.':autoReason(h);
  const hint=RTALK?'Take your time. Continue when you are ready.':townActive()&&h.mode==='focus'?'Take your time in town. Walk to someone and press Enter to talk.':aiOn()?'Auto repeats this finished road at '+eff+'%. A new road, and every dungeon, stays yours to play.':wait?'Fight waits for you. Choose Fight or an ability; ten seconds without combat input pauses it.':'Use an ability to keep fighting. Focus pauses when you stop; it never takes over.';
  const why=autoHint(h);$('#modeHint').textContent=why?hint+' '+why:hint;
  // xp
  const need=xpNeed(h.lvl),capped=h.lvl>=PLAY_CAP;$('#xpI').style.width=(capped?100:h.xp/need*100)+'%';
  const xl=capped?100:h.xp/need*100;$('#xpR').style.left=xl+'%';$('#xpR').style.width=(capped?0:Math.min(100-xl,h.rested/need*100))+'%';
  $('#xpT').textContent=capped?`Level ${h.lvl} · cap for this version`:`XP ${fmtI(h.xp)} / ${fmtI(need)}${h.rested>0?` · Rested ${fmtI(h.rested)}`:''}`;
  // status + err
  const am=activeMount();
  const st={seek:d?`Moving deeper into ${dungeonDef().name}…`:am?`Riding ${am.name} to find ${targetMob().name}…`:`Looking for ${targetMob().name}…`,fight:m?(combatWaiting()?`Waiting for your order · ${m.name}`:C.surge?`${m.name} is casting ${dungeonDef().surgeName}! Press D to dodge!`:`Fighting ${m.name}`):'',
    loot:C.loot&&C.loot.dun?'Boss loot: take it, or give it to a companion':'Uncollected loot waits for you · Take it (L)',rest:d||C.party.length?'The party catches its breath…':'Resting…',dead:`You are dead. Running back to your corpse: ${Math.ceil(C.t)}s`,town:`Travelling to ${hubName()}: ${Math.ceil(C.t)}s`,intown:`In town at ${hubName()}. Visit the Inn to rest or the Smithy to sell and repair.`}[C.phase]||'';
  $('#status').textContent=RTALK&&RTALK.townService?'':st;$('#err').textContent=C.errT>0?C.err:'';
  // loot window
  const lw=$('#lootwin');lw.hidden=!(C.phase==='loot'&&C.loot);if(!lw.hidden){const dl=C.loot.dun;
    const room=h.bags.length>=16&&C.loot.items.length?'<li class="loot-help">Satchel full. '+(dl?'Give an item to a companion, or make room before taking it.':'Visit the Smithy to make room, then return for these drops.')+'</li>':'';
    const html=room+(C.loot.money?`<li>${moneyStr(C.loot.money)}</li>`:'')+C.loot.items.map(it=>`<li style="margin:3px 0">${itemSpan(it)}${dl?` ${canEquip(it)&&score(it)>score(h.gear[it.slot])?'<span class="pill" style="color:#7cf08a">Upgrade</span>':''} <button class="btn sm" data-act="dtake" data-arg="${it.id}">Take</button> <button class="btn sm alt" data-act="dgive" data-arg="${it.id}">Give to a companion</button>`:''}</li>`).join('');
    const ll=$('#lootList');if(ll.dataset.h!==html){ll.innerHTML=html;ll.dataset.h=html;}}
  // log
  const lg=C.lines.slice(-7).map(l=>`<div class="${l.cls}">${l.txt}</div>`).join('');const le=$('#log');if(le.dataset.h!==lg){le.innerHTML=lg;le.dataset.h=lg;}
  // badges
  const ready=h.quests.active.some(id=>qState(ALLQ[id])==='ready');const qb=$('#qBadge');qb.hidden=!ready&&h.quests.active.length>0;qb.textContent=ready?'?':'!';const carried=document.getElementById('fieldQuestReady');if(carried)carried.hidden=!ready;
  const ups=h.bags.filter(it=>canEquip(it)&&score(it)>score(h.gear[it.slot])).length;const bb=$('#bBadge');bb.hidden=!ups;bb.textContent=ups;
  const tp=h.lvl>=10?talentPoints():0;const tb=$('#tBadge');tb.hidden=!tp;tb.textContent=tp;
  $('#aBadge').hidden=h.seenAddons!==false;
  $('#mBadge').hidden=!(h.lvl>=RIDING[1].lvl&&!h.riding);
  renderTab(false);
}

/* ---- character creation ---- */
const NAMES=['Aldren','Brienne','Corvin','Dara','Elric','Fenna','Garrick','Hela','Isolde','Joren','Kael','Lyra','Maren','Nyssa','Orrin','Petra','Quill','Rowan','Sable','Tamsin','Ulric','Vesna','Wren','Yara','Zarek','Thrum','Grukk','Velra','Ishka','Morka'];
let CR={name:pick(NAMES),faction:'concord',race:'human',cls:'warrior',pace:'classic'};
function createHTML(){
  const f=FACTIONS[CR.faction];if(!f.races.includes(CR.race))CR.race=f.races[0];
  return `<h2>Create your hero</h2><p class="sub">Two factions share a broken continent. Pick your side, your people and your path.</p>
  <h4>Faction</h4><div class="choices">${Object.entries(FACTIONS).map(([id,x])=>`<button class="choice ${CR.faction===id?'on':''}" data-act="cr" data-arg="faction:${id}"><b style="color:${x.col}">${x.name}</b><span>${x.desc}</span><span>Starts in ${ZONES[x.start].name}.</span></button>`).join('')}</div>
  <h4>Race</h4><div class="choices">${f.races.map(id=>`<button class="choice ${CR.race===id?'on':''}" data-act="cr" data-arg="race:${id}"><b>${RACES[id].name}</b><span>${RACES[id].bonus}</span></button>`).join('')}</div>
  <h4>Class</h4><div class="choices">${Object.entries(CLASSES).map(([id,k])=>`<button class="choice ${CR.cls===id?'on':''}" data-act="cr" data-arg="cls:${id}"><b style="color:${k.col}">${k.name}</b><span>${k.role} · ${k.res[0].toUpperCase()+k.res.slice(1)}</span><span>${k.desc}</span></button>`).join('')}</div>
  <h4>Journey length</h4><div class="choices">${Object.entries(PACE).map(([id,p])=>`<button class="choice ${CR.pace===id?'on':''}" data-act="cr" data-arg="pace:${id}"><b>${p.name}</b><span>${p.desc} You can change it later in the Journal.</span></button>`).join('')}</div>
  <h4>Name</h4><input class="nameinp" id="crName" maxlength="14" value="${CR.name}" aria-label="Hero name">
  <div class="mfoot">${S.chars.length?'<button class="btn alt" data-act="chars">Back to characters</button>':''}<button class="btn" data-act="create">Enter the world</button></div>`;
}
function ago(t){const s=(Date.now()-t)/1000;if(s<90)return 'just now';if(s<3600)return Math.round(s/60)+' min ago';if(s<86400)return Math.round(s/3600)+' h ago';return Math.round(s/86400)+' days ago';}
function charsHTML(){const cur=H();
  return `<h2>Characters</h2><p class="sub">Each hero keeps their own gear, quests, pets and addons. Heroes you aren't playing rest at the inn and build up rested experience.</p>
  ${S.chars.map(c=>{const K=CLASSES[c.cls],need=xpNeed(c.lvl),playing=cur&&cur.id===c.id;
    return `<div class="rowl"><div class="l"><b style="color:${K.col};font-family:var(--f-head);font-size:19px;font-weight:400">${c.name}</b> <span class="crest" style="background:${FACTIONS[c.faction].col};margin-left:4px"></span>
      <div class="meta">Level ${c.lvl} ${RACES[c.race].name} ${K.name} · ${ZONES[c.zone].name}${c.pets&&c.pets.length?` · ${c.pets.length} pet${c.pets.length>1?'s':''}`:''}${c.lvl<PLAY_CAP&&c.rested>=need*.01?` · <span style="color:var(--rested)">${Math.round(c.rested/need*100)}% rested</span>`:''} · ${playing?'playing now':'last played '+ago(c.lastPlayed||S.last)}</div></div>
      <div class="r">${playing?'<span class="pill" style="color:#7cf08a">Playing</span>':`<button class="btn sm" data-act="charplay" data-arg="${c.id}">Play</button>`}<button class="btn sm alt" data-act="chardel" data-arg="${c.id}">Delete</button></div></div>`;}).join('')||'<p class="meta">No characters yet.</p>'}
  <div class="mfoot">${S.chars.length<MAX_CHARS?'<button class="btn" data-act="charnew">Create new character</button>':`<span class="meta">All ${MAX_CHARS} character slots are full.</span>`}${cur?'<button class="btn alt" data-act="close">Back to the game</button>':''}</div>`;}
function switchTo(id){
  if(H()&&C)save();
  S.cur=id;const h=H();if(!h)return;const away=(Date.now()-(h.lastPlayed||S.last))/1000;
  boot();const r=offline(away,false);save();
  toast(`Welcome back, ${h.name}`);if(r&&r.rested>1)line(`${h.name} rested for ${fmtTime(r.sec)}: +${fmtI(r.rested)} rested XP.`,'l-xp');
}
function deleteChar(id){
  const c=S.chars.find(x=>x.id===id);if(!c)return;S.chars=S.chars.filter(x=>x.id!==id);ROSTER.forget(id);
  if(S.cur===id){S.cur=null;C=null;}
  if(!S.chars.length){Arcade.erase(KEY,'realmbound');S=emptyS();CR.name=pick(NAMES);openModal('create',createHTML());return;}
  Arcade.save(KEY,S);openModal('chars',charsHTML());
}
function lootAll(){if(C.phase!=='loot'||!C.loot)return;C.lastInput=C.run;
  const dungeon=!!C.loot.dun,left=takeLoot(C.loot,true);
  if(left.items.length){if(dungeon){C.loot={...left,dun:true};}else holdFieldLoot(left);return;}
  if(dungeon){afterDungeonPull();return;}
  H().fieldLoot=null;C.loot=null;afterFight();}
/* ---- the group finder ---- */
let LFG={sel:[],tier:0,id:'sanctum'};
function lfgOk(n){return n&&npcLvl(n)>=dungeonDef(LFG.id).minLvl-2;}
function lfgHTML(){const h=H(),def=dungeonDef(LFG.id),record=dungeonStats(LFG.id);
  const friends=h.npcs.filter(n=>n.met&&affLvl(n)>=1&&lfgOk(n)).sort((a,b)=>b.aff-a.aff);
  const sel=LFG.sel.map(npcOf).filter(Boolean),roles=sel.map(n=>ROLE_OF[n.cls]);
  const me=heroRole(),tank=roles.includes('tank')||me==='tank',heal=roles.includes('heal')||me==='heal'; // your role follows your talents (T1-A)
  const tiers=[];for(let t=0;t<=record.best+1;t++)tiers.push(t);
  return `<h2>${def.name}</h2><p class="sub">Pick four companions. Friends fight better, dodge ${def.surgeName} more often and unlock combos. Strangers fill empty spots.</p>
  <h4>Your group ${sel.length}/4</h4>
  ${sel.length?sel.map(n=>`<button class="lfgrow on" data-act="lfgsel" data-arg="${n.id}"><span><b style="color:${CLASSES[n.cls].col}">${n.name}</b> <span class="meta">${ROLE_NAME[ROLE_OF[n.cls]]} · level ${npcLvl(n)} · ${n.met?AFFINITY[affLvl(n)].n:'Stranger'}</span></span><span class="meta">Remove</span></button>`).join(''):'<p class="meta">Nobody picked yet.</p>'}
  <p class="meta" style="margin:6px 0">${tank?'✓':'✗'} Tank ${me==='tank'?'(you)':''} · ${heal?'✓':'✗'} Healer ${me==='heal'?'(you)':''}${!tank||!heal?' · Missing roles make bosses much harder.':''}</p>
  <h4>Friends available</h4>
  ${friends.filter(n=>!LFG.sel.includes(n.id)).map(n=>`<button class="lfgrow" data-act="lfgsel" data-arg="${n.id}"><span><b style="color:${CLASSES[n.cls].col}">${n.name}</b> <span class="meta">${ROLE_NAME[ROLE_OF[n.cls]]} · level ${npcLvl(n)} · ${AFFINITY[affLvl(n)].n}</span></span><span class="meta">Add</span></button>`).join('')||'<p class="meta">No friends at the right level yet. Strangers can fill the group.</p>'}
  <div class="mfoot" style="justify-content:flex-start"><button class="btn alt" data-act="lfgfill" ${sel.length>=4?'disabled':''}>Fill with strangers</button></div>
  <h4>Difficulty</h4><div class="mfoot" style="justify-content:flex-start;margin-top:0">${tiers.map(t=>`<button class="btn sm ${LFG.tier===t?'':'alt'}" data-act="lfgtier" data-arg="${t}">${t?'Heroic '+t:'Normal'}</button>`).join('')}</div>
  <p class="meta">${LFG.tier?`Enemies are ${Math.round((tierMult(LFG.tier)-1)*100)}% tougher, loot is ${LFG.tier*2} item levels higher, and ${LFG.tier>=4?'two random modifiers apply':'one random modifier applies'} (${Object.values(DUN_MODS).map(m=>m.name).join(', ')}).`:'The first clear unlocks Heroic 1.'}</p>
  <div class="mfoot"><button class="btn alt" data-act="close">Not now</button><button class="btn" data-act="lfgenter" ${sel.length===4?'':'disabled'}>Enter dungeon</button></div>`;}
function offlineHTML(r){return `<h2>Welcome back</h2><p class="sub">You were away for ${fmtTime(r.sec)}. Your hero rested at the inn. The road waits for you.</p>
  <p class="meta">Rested experience gained: ${fmtI(r.rested)}. This doubles experience from your next kills until it runs out; no battles, loot or quests happened while you were away.</p><div class="mfoot"><button class="btn" data-act="close">Continue</button></div>`;}
