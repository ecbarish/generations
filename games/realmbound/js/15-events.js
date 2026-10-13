'use strict';
/* ---- events ---- */
function arm(el,label,armedLabel){if(el.classList.contains('armed')){el.classList.remove('armed');el.textContent=label;return true;}el.classList.add('armed');el.textContent=armedLabel;setTimeout(()=>{if(el.isConnected){el.classList.remove('armed');el.textContent=label;}},4000);return false;}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,arg=el.dataset.arg;
  if(a==='cr'){const [k,v]=arg.split(':');CR.name=($('#crName')||{}).value||CR.name;CR[k]=v;openModal('create',createHTML());return;}
  if(a==='create'){if(S.chars.length>=MAX_CHARS){openModal('chars',charsHTML());return;}
    if(H()&&C)save();
    const nm=(($('#crName')||{}).value||'').trim().replace(/[^A-Za-z' -]/g,'').slice(0,14)||pick(NAMES);const nh=newHero(nm[0].toUpperCase()+nm.slice(1),CR.faction,CR.race,CR.cls);nh.pace=CR.pace;
    clearArrival();S.chars.push(nh);S.cur=nh.id;
    recalc();C=freshC();C.hp=ST.hpMax;C.res=CLASSES[CR.cls].res==='mana'?ST.resMax:0;closeModal();slog(`${nh.name} arrived in ${ZONES[nh.zone].name}.`);
    const first=QUESTS[nh.zone][0];accept(first.id);toast(`Welcome to ${ZONES[nh.zone].name}`);save();curKey=null;buildSlots();updateWorld();beginArrival(false);return;}
  if(a==='chars'){openModal('chars',charsHTML());return;}
  if(a==='sound'){SND.cycle();return;}
  if(a==='charnew'){CR.name=pick(NAMES);openModal('create',createHTML());return;}
  if(a==='charplay'){closeModal();switchTo(Number(arg));return;}
  if(a==='chardel'){const c=S.chars.find(x=>x.id===Number(arg));if(arm(el,'Delete',`Delete ${c?c.name:''}?`))deleteChar(Number(arg));return;}
  if(!H()||(arrivalPaused()&&a!=='close'))return;
  switch(a){
    case 'press':press(Number(arg));break;
    case 'fight':beginFight();break;
    case 'mode':if(arg==='auto'&&!autoAllowed()){err('Earn the Rotation Macro and return to an out-levelled road to use Auto.');break;}H().mode=arg==='auto'?'auto':'focus';C.lastInput=-99;break;
    case 'tab':S.tab=arg;renderTab(true);break;
    case 'loot':lootAll();break;
    case 'accept':questOffer(arg);break; // hear the giver first (16-scenes.js)
    case 'abandon':abandon(arg);break;
    case 'followquest':followThornvaleQuest(arg);break;
    case 'turnin':{const [id,c]=arg.split(':');turnIn(id,Number(c),false);questThanks(id);break;}
    case 'equip':equip(Number(arg),false);break;
    case 'sell':sellItem(Number(arg));break;
    case 'selljunk':sellJunk(false);break;
    case 'repair':repairAll(false);break;
    case 'town':goTown();break;
    case 'leavetown':leaveTown();break;
    case 'zone':if(H().dun){err('Leave the dungeon first.');break;}if(C.phase==='fight'){err("You can't travel in the middle of a fight.");break;}if(!ZONE_ORDER[H().faction].includes(arg))break;if(H().lvl<ZONES[arg].lv[0]-2){err(`${ZONES[arg].name} is too dangerous before level ${ZONES[arg].lv[0]-2}.`);break;}H().zone=arg;H().grind=null;C.phase='seek';C.t=travel(12);C.mob=null;line(`You travel to ${ZONES[arg].name}.`,'l-sys');break;
    case 'talent':{const h=H(),t=TALENT_LIST[h.cls].find(x=>x.id===arg);if(!t)break;const r=h.talents[arg]||0;if(talentPoints()>0&&r<t.max&&(!t.req||treePoints(t.ti)>=t.req)){h.talents[arg]=r+1;recalc();}break;}
    case 'resettal':respec();break;
    case 'pace':{const h=H();if(PACE[arg]&&!h.dun&&h.pace!==arg){h.pace=arg;slog(`Chose a ${PACE[arg].name} journey.`);toast(`Journey length: ${PACE[arg].name}`);}break;}
    case 'addon':H().addons.on[arg]=!H().addons.on[arg];break;
    case 'tame':startTame();break;
    case 'encwave':encAct('wave');break;
    case 'enchelp':encAct('help');break;
    case 'encinvite':encAct('invite');break;
    case 'combo':doCombo(true);break;
    case 'dodge':dodgeNow();break;
    case 'dtake':dunLootAct(Number(arg),false);break;
    case 'dgive':dunLootAct(Number(arg),true);break;
    case 'leavedun':if(H().dun){leaveDungeon(`You leave ${dungeonDef().name}.`);}break;
    case 'kick':{const h=H(),n=npcOf(Number(arg));h.party=h.party.filter(x=>x!==Number(arg));syncParty();if(n)line(`${n.name}: Take care. Find me if you need me.`,'l-say');break;}
    case 'invite':{const h=H(),n=npcOf(Number(arg));if(!n||h.dun||h.party.length>=4||h.party.includes(n.id))break;n.joinedAt=C.run;h.party.push(n.id);syncParty();say(n,'greet');line(`${n.name} comes to meet you and joins your party.`,'l-sys');break;}
    case 'lfg':{const h=H();LFG.id=DUNGEONS[arg]?arg:'sanctum';LFG.sel=h.party.filter(id=>lfgOk(npcOf(id))).slice(0,4);LFG.tier=Math.max(0,dungeonStats(LFG.id).best+1);openModal('lfg',lfgHTML());break;}
    case 'lfgsel':{const id=Number(arg);if(LFG.sel.includes(id))LFG.sel=LFG.sel.filter(x=>x!==id);else if(LFG.sel.length<4)LFG.sel.push(id);openModal('lfg',lfgHTML());break;}
    case 'lfgfill':{const h=H();const pool=h.npcs.filter(n=>lfgOk(n)&&!LFG.sel.includes(n.id)).sort(()=>R()-.5);
      const need=r=>!LFG.sel.some(id=>ROLE_OF[npcOf(id).cls]===r)&&heroRole()!==r;
      for(const r of ['tank','heal']){if(LFG.sel.length<4&&need(r)){const n=pool.find(x=>ROLE_OF[x.cls]===r&&!LFG.sel.includes(x.id));if(n)LFG.sel.push(n.id);}}
      for(const n of pool){if(LFG.sel.length>=4)break;if(!LFG.sel.includes(n.id))LFG.sel.push(n.id);}openModal('lfg',lfgHTML());break;}
    case 'lfgtier':LFG.tier=Number(arg);openModal('lfg',lfgHTML());break;
    case 'lfgenter':{const h=H();if(C.phase==='fight'){err('Finish your fight first.');break;}const def=dungeonDef(LFG.id);if(h.dun||LFG.sel.length!==4||h.lvl<def.minLvl||h.zone!==def.zone||LFG.tier<0||LFG.tier>dungeonStats(LFG.id).best+1)break;
      for(const id of LFG.sel){const n=npcOf(id);if(!n.met)noteNpc(n,`Joined you for ${def.name} at level ${h.lvl}.`);n.met=true;n.joinedAt=C.run;}
      closeModal();startDungeon(LFG.tier,LFG.sel,LFG.id);break;}
    case 'buyriding':{const h=H(),nx=RIDING[h.riding+1];if(!nx||!inTown()||h.lvl<nx.lvl||h.money<nx.cost)break;h.money-=nx.cost;h.riding++;toast(`You learned ${nx.n}`);slog(`Learned ${nx.n}.`);line(`You learned ${nx.n}.`,'l-sys');break;}
    case 'buymount':{const h=H(),s=MOUNT_SHOP[h.faction].find(x=>x.key===arg);if(!s||!inTown()||!h.riding||h.lvl<s.lvl||h.money<s.cost||h.mounts.some(m=>m.key===s.key))break;
      h.money-=s.cost;const m={id:uid(),key:s.key,name:s.name,kind:s.kind,col:s.col,rar:s.rar,base:s.base,xp:0};h.mounts.push(m);if(!activeMount())h.mount=m.id;toast(`New mount: ${s.name}`);slog(`Bought a ${s.name}.`);break;}
    case 'ride':{const h=H();if(!h.riding)break;h.mount=arg==='pet'?'pet':Number(arg);line(`You saddle up on ${activeMount()?activeMount().name:'your mount'}.`,'l-sys');break;}
    case 'trainpet':{const h=H(),p=petOf();if(!p||!inTown()||h.money<PET_MOUNT_COST||!MOUNTABLE.includes(p.family)||bondLvl(p)<3||p.lvl<10||!h.riding)break;
      h.money-=PET_MOUNT_COST;p.mountTrained=true;p.rideXp=p.rideXp||0;if(!activeMount())h.mount='pet';toast(`${p.name} can now carry you`);slog(`Trained ${p.name} as a mount.`);break;}
    case 'learnmount':{const h=H(),i=h.bags.findIndex(x=>x.id===Number(arg));if(i<0)break;const it=h.bags[i],r=REINS[it.mid];
      if(h.mounts.some(m=>m.key===it.mid)){err('You already know that mount.');break;}h.bags.splice(i,1);
      const m={id:uid(),key:it.mid,name:r.name.replace(/^Reins of (the )?/,''),kind:r.kind,col:r.col,rar:r.rar,base:r.base,xp:0};h.mounts.push(m);if(h.riding&&!activeMount())h.mount=m.id;toast(`New mount: ${m.name}`);slog(`Learned to ride ${m.name}.`);break;}
    case 'feed':feedPet(arg?Number(arg):null,false);C.lastInput=C.run;break;
    case 'buyfood':buyFood(false);break;
    case 'revive':{const p=petOf();if(p&&p.hp<=0&&C.phase!=='fight'&&!(C.reviving>0)){C.reviving=4;line(`You begin reviving ${p.name}.`,'l-sys');}else if(C.phase==='fight')err("You can't do that in combat.");break;}
    case 'rename':{const p=petOf(),v=(($('#petName')||{}).value||'').trim().replace(/[<>"&]/g,'').slice(0,18);if(p&&v){p.name=v;curKey=null;}break;}
    case 'petactive':{if(!inTown()){err('Swap pets at the stable in town.');break;}const h=H();if(C.phase==='fight')break;h.activePet=Number(arg);curKey=null;line(`${petOf().name} joins you.`,'l-pet');break;}
    case 'petrelease':if(arm(el,'Release','Click again')){const h=H(),id=Number(arg),p=h.pets.find(x=>x.id===id);h.pets=h.pets.filter(x=>x.id!==id);if(h.activePet===id)h.activePet=null;if(p){line(`You release ${p.name} back into the wild.`,'l-sys');slog(`Released ${p.name}.`);}curKey=null;}break;
    case 'close':if(modalKind!=='create')closeModal();break;
    case 'export':$('#saveTxt').value=Arcade.encode(S);$('#saveMsg').textContent='Save exported. Keep a copy somewhere safe.';break;
    case 'copy':{const t=$('#saveTxt');if(!t.value)t.value=Arcade.encode(S);const fb=()=>{t.select();$('#saveMsg').textContent='Selected. Press Ctrl+C to copy.';};try{navigator.clipboard.writeText(t.value).then(()=>$('#saveMsg').textContent='Copied.',fb);}catch(x){fb();}break;}
    case 'import':try{const o=Arcade.decode($('#saveTxt').value);if(!o||!(o.hero||Array.isArray(o.chars)))throw 0;S=migrate(o);boot();$('#saveMsg')&&($('#saveMsg').textContent='Save imported.');}catch(x){$('#saveMsg').textContent="That isn't a Realmbound save. Paste the whole exported block.";}break;
    case 'delete':if(arm(el,'Delete character','Click again to delete'))deleteChar(H().id);break;
  }
  if(H()&&C)updateWorld();
});
document.addEventListener('change',e=>{if(e.target.id==='grindSel'&&H()){H().grind=e.target.value||null;}});
document.addEventListener('keydown',e=>{if(!H()||!C||arrivalPaused()||(e.target.matches&&e.target.closest('input,textarea,select,button,a,summary,[role="dialog"],.arc-set-bg')))return;
  if(/^[1-9]$/.test(e.key)){press(Number(e.key)-1);updateWorld();e.preventDefault();}
  else if(e.key==='l'||e.key==='L'){lootAll();updateWorld();}
  else if(e.key==='c'||e.key==='C'){doCombo(true);updateWorld();}
  else if(e.key==='d'||e.key==='D'){dodgeNow();updateWorld();}
  else if(raidKeyPress(e.key)){updateWorld();}
  else if(e.key==='Escape'&&modalKind&&modalKind!=='create')closeModal();});

