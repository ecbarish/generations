'use strict';

/* ================= toasts / modal ================= */
function toast(m,c){const el=document.createElement('div');el.className='toast';el.style.setProperty('--tc',c||'var(--gold)');el.textContent=m;const b=$('#toasts');b.appendChild(el);while(b.children.length>4)b.firstChild.remove();setTimeout(()=>el.remove(),4200);}
let modalKind=null;
function openModal(kind,title,html){modalKind=kind;$('#mbar').textContent=title;$('#sheet').innerHTML=html;$('#modal').hidden=false;const b=$('#sheet').querySelector('button');if(b)b.focus({preventScroll:true});}
function closeModal(){modalKind=null;$('#modal').hidden=true;}
function relicHTML(){ensureRelicOffer();return `<h2>The boss dropped something</h2><p class="sub">Relics last until the season ends. Pick one.</p>
  <div class="cards" style="margin-top:12px">${(S.relicOffer||[]).map(id=>{const r=RELICS[id];return `<button class="card r-${r.r}" data-act="takerelic" data-arg="${id}"><span class="rar">${r.r}</span><span class="t">${r.name}</span><span class="d">${r.desc}</span></button>`;}).join('')}</div>
  <div class="mfoot"><button class="btn" data-act="close">Decide later</button></div>`;}
function regionHTML(){return `<h2>Choose where the guild sets up next</h2><p class="sub">Gold, floors, shops, facilities and relics reset. Renown, crest upgrades, staff and combos found stay.</p>
  <div class="cards" style="margin-top:12px">${S.regionOffer.map(id=>{const r=REGIONS[id];return `<button class="card" data-act="region" data-arg="${id}"><span class="t">${r.name}</span><span class="d">${r.flavor}</span><ul>${r.mods.map(m=>`<li>${m}</li>`).join('')}</ul></button>`;}).join('')}</div>`;}
function offlineHTML(r){return `<h2>Welcome back, Guildmaster</h2><p class="sub">You were away ${fmtTime(r.sec)}. The shops stayed open${r.farm?` and the party farmed ${floorName(S.floor)}`:''} at ${Math.round(r.eff*100)}% pace.</p>
  <div class="big" style="margin:12px 0">+${fmt(r.gain)} gold</div><div class="mfoot"><button class="btn gold" data-act="close">Back to work</button></div>`;}

/* ================= tabs ================= */
const MODES=[1,10,'max'];
const seg=()=>`<div class="seg" role="group" aria-label="Buy amount">${MODES.map(m=>`<button data-act="mode" data-arg="${m}" id="mode-${m}">${m==='max'?'Max':'×'+m}</button>`).join('')}</div>`;
function portraitsAfterBuild(){document.querySelectorAll('canvas[data-adv]').forEach(cv=>{const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const src=cv.dataset.src==='board'?S.board:S.party;
  const a=src.find(x=>String(x.id)===cv.dataset.adv);if(a){ctx.clearRect(0,0,cv.width,cv.height);hero(ctx,6,14,3,a,0);}});
  document.querySelectorAll('canvas[data-staff]').forEach(cv=>{const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const s=STAFF.find(x=>x.id===cv.dataset.staff);ctx.clearRect(0,0,cv.width,cv.height);
    if(S.staff.unl[s.id])staffSprite(ctx,6,14,3,s);else{ctx.fillStyle='#c9d5bb';ctx.font='24px DotGothic16, monospace';ctx.fillText('?',16,38);}});}
function advRow(a,src){const C=CLASSES[a.cls];return `<canvas class="portrait" width="48" height="56" data-adv="${a.id}" data-src="${src}"></canvas>`+
  `<div style="min-width:0"><div class="nm">${a.name} <span class="stars">${stars(a.star)}</span> <span class="cls" style="background:${C.color}">${C.name}</span></div>`;}
const TABS={
party:{
  key(){return S.party.map(a=>a.id).join(',')+'|'+D.size;},
  build(){
    let h=`<div class="thead"><div><h2>Party ${S.party.length}/${D.size}</h2><p class="sub">Levels raise attack and HP by 9% each. Class mixes unlock combos.</p></div>${seg()}</div>`;
    if(!S.party.length)h+=`<p class="empty">No one in the party. Hire someone at the Tavern.</p>`;
    S.party.forEach(a=>{h+=`<div class="row">${advRow(a,'party')}<div class="meta" id="pm-${a.id}"></div></div>
      <div class="acts"><button class="buy" data-act="lvl" data-arg="${a.id}" id="pb-${a.id}"><span class="l" id="pl-${a.id}"></span><span class="c" id="pc-${a.id}"></span></button>
      <button class="btn sm2 red" data-act="dismiss" data-arg="${a.id}">Dismiss</button></div></div>`;});
    h+=`<h4>Combos found ${Object.keys(S.combosFound).length}/${COMBOS.length}</h4><div class="combos">${COMBOS.map(c=>S.combosFound[c.id]?`<span class="combo ${D.combos.includes(c)?'on':''}"><b>${c.name}</b> · ${c.need} · ${c.desc}</span>`:`<span class="combo unk">??? · ${c.need}</span>`).join('')}</div>`;
    return h;
  },
  update(){
    S.party.forEach((a,i)=>{const e=D.each[i];if(!e||!$('#pm-'+a.id))return;$('#pm-'+a.id).textContent=`Lv ${a.lvl} · ATK ${fmt(e.atk)} · HP ${fmt(e.hp)} · ${CLASSES[a.cls].note}`;
      let k=S.buy==='max'?Math.max(1,lvlMax(a)):Number(S.buy);const c=lvlCostN(a,k),can=S.gold>=c;
      $('#pl-'+a.id).textContent=`Level +${k}`;$('#pc-'+a.id).textContent=fmt(c);const b=$('#pb-'+a.id);b.classList.toggle('can',can);b.disabled=!can;});
  }
},
tavern:{
  key(){return S.board.map(a=>a.id).join(',')+'|'+(S.party.length>=D.size);},
  build(){
    const full=S.party.length>=D.size;
    return `<div class="thead"><div><h2>Tavern board</h2><p class="sub">New faces every 90 seconds. Higher stars mean much stronger base stats. Upgrade the Tavern in town for better odds.</p></div>
      <button class="btn" data-act="reroll" id="rerollBtn"></button></div>
      ${full?`<p class="sub" style="color:var(--red);font-weight:700;margin-bottom:8px">The party is full. Dismiss someone to make room.</p>`:''}
      <div class="cards">${S.board.map(a=>{const C=CLASSES[a.cls];return `<div class="card"><canvas class="portrait" width="48" height="56" data-adv="${a.id}" data-src="board"></canvas>
        <span class="t">${a.name} <span class="stars">${stars(a.star)}</span></span><span class="cls" style="background:${C.color};align-self:flex-start">${C.name}</span>
        <span class="d">ATK ${fmt(C.atk*STAR_MULT[a.star])} · HP ${fmt(C.hp*STAR_MULT[a.star])}<br>${C.note}</span>
        <button class="buy" data-act="recruit" data-arg="${a.id}" id="rb-${a.id}"><span class="l">Recruit</span><span class="c">${fmt(recruitCost(a))}</span></button></div>`;}).join('')}</div>
      <p class="sub px" id="boardT" style="margin-top:10px"></p>`;
  },
  update(){
    const full=S.party.length>=D.size;S.board.forEach(a=>{const b=$('#rb-'+a.id);if(!b)return;const can=!full&&S.gold>=recruitCost(a);b.disabled=!can;b.classList.toggle('can',can);});
    $('#boardT').textContent=`New faces in ${Math.ceil(S.boardT)}s`;const rb=$('#rerollBtn');const c=rerollCost();rb.textContent=`Call new faces · ${fmt(c)}`;rb.disabled=S.gold<c;
  }
},
town:{
  key(){return BIZ.map((_,i)=>bizUnlocked(i)?1:0).join('');},
  build(){
    let h=`<div class="thead"><div><h2>Town</h2><p class="sub">Shops earn gold while the party fights. Every 25 of a shop doubles its income.</p></div>${seg()}</div>`;
    let shownLock=false;
    BIZ.forEach((b,i)=>{if(!bizUnlocked(i)){if(shownLock)return;shownLock=true;h+=`<div class="row locked"><div class="icon" style="background:#9aa5b5">?</div><div><div class="nm">${b.name}</div><div class="meta">Opens when the party reaches ${floorName(b.floor)}</div></div><span></span></div>`;return;}
      h+=`<div class="row"><div class="icon" style="background:${b.col}">${b.ch}</div><div style="min-width:0"><div class="nm">${b.name} <span class="px" id="bo-${i}"></span></div><div class="meta" id="bm-${i}"></div>
      <div class="ms"><div class="msbar"><i id="bms-${i}"></i></div><span id="bml-${i}"></span></div></div>
      <div class="acts"><button class="buy" data-act="biz" data-arg="${i}" id="bb-${i}"><span class="l" id="bl-${i}"></span><span class="c" id="bc-${i}"></span></button></div></div>`;});
    h+=`<h4>Facilities</h4>`;
    FAC.forEach(f=>{h+=`<div class="row"><div class="icon" style="background:${f.col}">${f.ch}</div><div style="min-width:0"><div class="nm">${f.name} <span class="px" id="fl-${f.id}"></span></div><div class="meta" id="fd-${f.id}"></div></div>
      <div class="acts"><button class="buy" data-act="fac" data-arg="${f.id}" id="fb-${f.id}"><span class="l">Upgrade</span><span class="c" id="fc-${f.id}"></span></button></div></div>`;});
    return h;
  },
  update(){
    BIZ.forEach((b,i)=>{if(!$('#bo-'+i))return;const e=D.bizEach[i];$('#bo-'+i).textContent='×'+S.biz[i];$('#bm-'+i).textContent=`${fmt(e.per)}/s each · ${fmt(e.total)}/s total`;
      const r=S.biz[i]%25;$('#bms-'+i).style.width=(r/25*100)+'%';$('#bml-'+i).textContent=`${r}/25 to ×2`;
      const k=S.buy==='max'?Math.max(1,bizMax(i)):Number(S.buy),c=bizCostN(i,k),can=S.gold>=c;$('#bl-'+i).textContent=`Buy ${k}`;$('#bc-'+i).textContent=fmt(c);
      const bt=$('#bb-'+i);bt.disabled=!can;bt.classList.toggle('can',can);});
    FAC.forEach(f=>{const l=S.fac[f.id]||0;$('#fl-'+f.id).textContent=l?`Lv ${l}`:'';$('#fd-'+f.id).textContent=f.desc(l);const b=$('#fb-'+f.id);
      if(l>=f.max){$('#fc-'+f.id).textContent='Max';b.disabled=true;b.classList.remove('can');return;}const c=facCost(f);$('#fc-'+f.id).textContent=fmt(c);b.disabled=S.gold<c;b.classList.toggle('can',S.gold>=c);});
  }
},
staff:{
  key(){return STAFF.map(s=>S.staff.unl[s.id]?1:0).join('');},
  build(){S.seenStaff=true;
    return `<div class="thead"><div><h2>Staff</h2><p class="sub">Your managers. They join because of what you've done, never because you paid, and they stay forever.</p></div></div>
    ${STAFF.map(s=>{const u=S.staff.unl[s.id];return `<div class="row ${u?'':'locked'}"><canvas class="portrait" width="48" height="56" data-staff="${s.id}"></canvas>
      <div style="min-width:0"><div class="nm">${u?s.who:'???'} <span class="meta">${s.role}</span> <span class="state ${u?'on':'off'}">${u?'Hired':'Not yet'}</span></div>
      <div class="meta">${s.desc}${s.id==='aldric'&&u?` Starts a season at <input class="inp" type="number" min="1" id="autoAt" value="${S.autoAt}" aria-label="Renown needed"> Renown.`:''}</div>
      ${u?'':`<div class="req" id="sr-${s.id}"></div>`}</div>
      ${u?`<button class="tgl" data-act="staff" data-arg="${s.id}" id="st-${s.id}" aria-label="${s.who} on or off"><span class="sw"></span></button>`:'<span></span>'}</div>`;}).join('')}
    <p class="sub px" id="staffIv" style="margin-top:8px"></p>`;},
  update(){STAFF.forEach(s=>{const t=$('#st-'+s.id);if(t)t.setAttribute('aria-pressed',S.staff.on[s.id]?'true':'false');const r=$('#sr-'+s.id);if(r){const [a,b]=s.prog();r.textContent=`${s.req}: ${fmtI(Math.min(a,b))}/${b}`;}});
    $('#staffIv').textContent=`Staff act every ${staffIv(S.crest.staffx||0).toFixed(2)}s`;}
},
guild:{
  key(){return 'g'+S.relics.length;},
  build(){const r=R();
    return `<div class="thead"><div><h2>Guild hall</h2><p class="sub">End the season to turn your deepest floor into Renown. Spend it on the guild crest, or keep it: every unspent point adds 2% to gold and attack.</p></div></div>
    <div class="season"><div><div class="lbl">New season now pays</div><div class="g" id="sg"></div><div class="sm" id="sn"></div></div><button class="btn red" data-act="season" id="seasonBtn">End the season</button></div>
    <h4>Guild crest</h4>${CREST.map(c=>`<div class="row" style="grid-template-columns:minmax(0,1fr) auto"><div style="min-width:0"><div class="nm">${c.name} <span class="px" style="color:var(--violet)" id="cl-${c.id}"></span></div><div class="meta" id="cd-${c.id}"></div></div>
      <div class="acts"><button class="buy" data-act="crest" data-arg="${c.id}" id="cb-${c.id}"><span class="l">Renown</span><span class="c" id="cc-${c.id}"></span></button></div></div>`).join('')}
    <h4>Relics this season</h4>${S.relics.length?`<div class="combos">${S.relics.map(id=>`<span class="combo"><b>${RELICS[id].name}</b> · ${RELICS[id].desc}</span>`).join('')}</div>`:'<p class="empty">None yet. Bosses on every 10th floor drop them.</p>'}
    <h4>Region · ${r.name}</h4><p class="sub">${r.flavor}</p><ul class="sub">${r.mods.map(m=>`<li>${m}</li>`).join('')}</ul>
    <h4>The road ahead</h4><p class="sub">Later layers, not built yet.</p><div class="road">${ROAD.map(x=>`<div class="${x[2]?'here':''}"><b>${x[0]}</b> · ${x[1]}</div>`).join('')}</div>`;},
  update(){const g=renownGain();$('#sg').textContent=`+${fmt(g)} Renown`;const nf=nextRenownFloor();
    $('#sn').textContent=S.best<SEASON_MIN?`Reach ${floorName(SEASON_MIN)} to earn Renown (best so far ${floorName(S.best)}).`:`Best ${floorName(S.best)}. More at ${nf?floorName(nf):'deeper floors'}.`;
    const sb=$('#seasonBtn');if(g<=0){sb.disabled=true;sb.classList.remove('armed');sb.textContent='End the season';}else sb.disabled=false;
    CREST.forEach(c=>{const l=S.crest[c.id]||0;$('#cl-'+c.id).textContent=l?`Lv ${l}`:'';$('#cd-'+c.id).textContent=c.desc(l);const b=$('#cb-'+c.id);
      if(l>=c.max){$('#cc-'+c.id).textContent='Max';b.disabled=true;b.classList.remove('can');return;}const cost=c.cost(l);$('#cc-'+c.id).textContent=fmt(cost);b.disabled=S.renown<cost;b.classList.toggle('can',S.renown>=cost);});}
},
ledger:{
  key(){return 'l';},
  build(){return `<div class="thead"><div><h2>Ledger</h2><p class="sub">The game saves in this browser every 10 seconds. Export a backup now and then: clearing site data erases it.</p></div></div>
    <div class="stats">${[['Time played','l1'],['This season','l2'],['Seasons','l3'],['Deepest floor ever','l4'],['Monsters defeated','l5'],['Bosses defeated','l6'],['Adventurers hired','l7'],['Renown earned','l8']].map(([k,id])=>`<div><div class="k">${k}</div><div class="v" id="${id}"></div></div>`).join('')}</div>
    <h4>Guild diary</h4><ul class="logl" id="logl"></ul>
    <h4>Save</h4><textarea id="saveTxt" placeholder="Export puts your save here. Paste a save here to import it." aria-label="Save data"></textarea>
    <div class="btnrow"><button class="btn" data-act="save">Save now</button><button class="btn" data-act="export">Export</button><button class="btn" data-act="copy">Copy</button><button class="btn" data-act="import">Import pasted save</button><button class="btn red" data-act="reset">Erase everything</button></div>
    <p class="sub" id="saveMsg"></p>${Arcade.saveToolsHTML(KEY,'btn')}`;},
  update(){const s=S.stats,set=(id,v)=>{const e=$('#'+id);if(e)e.textContent=v;};set('l1',fmtTime(s.play));set('l2',fmtTime(s.run));set('l3',s.seasons);set('l4',floorName(s.bestEver));set('l5',fmtI(s.kills));set('l6',s.bosses);set('l7',s.recruits);set('l8',fmt(S.renownLife));
    const L=$('#logl'),html=S.log.slice(0,25).map(m=>`<li>${m}</li>`).join('');if(L.dataset.h!==html){L.innerHTML=html;L.dataset.h=html;}}
}};
let curKey=null;
function renderTab(force){const t=TABS[S.tab]||TABS.party;const k=S.tab+':'+t.key();
  if(force||k!==curKey){curKey=k;$('#tabbody').innerHTML=t.build();portraitsAfterBuild();}
  MODES.forEach(m=>{const b=$('#mode-'+m);if(b)b.classList.toggle('on',String(S.buy)===String(m));});t.update();
  document.querySelectorAll('.tabs [role=tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.arg===S.tab?'true':'false'));}

/* ================= HUD ================= */
function recoveryPrep(){
  return S.party.slice().sort((a,b)=>a.lvl-b.lvl||a.id-b.id)[0]||null;
}
function updateRecovery(){
  const panel=$('#recovery');panel.hidden=!(S.resting>0&&S.party.length&&!S.regionOffer);
  if(panel.hidden)return;
  $('#recovery-time').textContent=Math.ceil(S.resting)+'s to recover';
  const a=recoveryPrep(),cost=lvlCostN(a,1),b=$('#recovery-train');
  b.dataset.arg=String(a.id);b.textContent='Train '+a.name+' · '+fmt(cost)+' gold';b.disabled=S.gold<cost;
  b.setAttribute('aria-label','Train '+a.name+' one level for '+fmt(cost)+' gold');
  $('#recovery-back').disabled=S.floor<=1;
}
function updateUI(){
  updateRecovery();
  const r=R(),m=S.mon;
  $('#seasonNo').textContent=S.stats.seasons+1;$('#regionName').textContent=r.name;$('#regionNote').textContent=r.mods.join(' · ');
  $('#gold').textContent=fmt(S.gold);$('#gps').textContent=`${fmt(D.gps)}/s from shops`;
  $('#floorTop').textContent=floorName(S.floor);$('#bestTop').textContent=`Best ${floorName(S.best)}`;
  $('#renTop').textContent=fmt(S.renown);$('#renBonus').textContent=`+${fmt(S.renown*2)}% gold, +${fmt(S.renown*2)}% attack`;
  $('#stageTitle').textContent=m?`${floorName(m.f)} · ${m.name}`:floorName(S.floor);$('#stageTag').textContent=m&&m.boss?'BOSS':'';
  $('#monHp').style.width=(m?Math.max(0,m.hp/m.max*100):0)+'%';$('#monHpT').textContent=m?fmt(Math.max(0,m.hp)):'-';
  $('#pHp').style.width=(D.pmax?Math.max(0,S.php/D.pmax*100):0)+'%';$('#pHpT').textContent=fmt(Math.max(0,S.php));
  let st;if(!S.party.length)st='No adventurers. Hire someone at the Tavern.';else if(S.resting>0)st=`Party wiped out. Resting at the inn: ${S.resting.toFixed(1)}s.`;
  else if(S.push&&S.pushWait>0)st=`Regrouping before the next push: ${Math.ceil(S.pushWait)}s. Farming ${floorName(S.floor)}.`;else if(S.push)st='Fighting and pushing deeper.';else st=`Farming ${floorName(S.floor)}.`;
  $('#status').textContent=st;$('#pushBtn').setAttribute('aria-pressed',S.push?'true':'false');
  const rb=$('#relicBtn');rb.hidden=S.relicPending<=0;rb.textContent=`Choose a relic (${S.relicPending})`;
  $('#powerT').textContent=`ATK ${fmt(D.patk)} · HP ${fmt(D.pmax)}`;
  const ac=$('#activeCombos'),html=D.combos.length?D.combos.map(c=>`<span class="combo on"><b>${c.name}</b> · ${c.desc}</span>`).join(''):`<span class="sm">No combos active. Mix classes to find them: ${Object.keys(S.combosFound).length}/${COMBOS.length} found.</span>`;
  if(ac.dataset.h!==html){ac.innerHTML=html;ac.dataset.h=html;}
  $('#tavBadge').hidden=!(S.party.length<D.size&&S.board.some(a=>recruitCost(a)<=S.gold));$('#staffBadge').hidden=S.seenStaff!==false;
  if(S.regionOffer&&modalKind!=='region')openModal('region','New season',regionHTML());
  if(modalKind==='relic'&&S.relicPending<=0)closeModal();
  renderTab(false);
}

