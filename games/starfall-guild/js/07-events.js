'use strict';

/* ================= events ================= */
function arm(el,label,armedLabel){if(el.classList.contains('armed')){el.classList.remove('armed');el.textContent=label;return true;}
  el.classList.add('armed');el.textContent=armedLabel;setTimeout(()=>{if(el.isConnected){el.classList.remove('armed');el.textContent=label;}},4000);return false;}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,arg=el.dataset.arg;
  switch(a){
    case 'sound':SND.cycle();break;
    case 'tab':S.tab=arg;renderTab(true);break;
    case 'mode':S.buy=arg==='max'?'max':Number(arg);break;
    case 'lvl':levelUp(Number(arg),S.buy);break;
    case 'recovery-train':{const a=S.party.find(a=>a.id===Number(arg));if(S.resting>0&&a&&levelUp(a.id,1))toast(a.name+' reaches level '+a.lvl+'. Stronger for the next delve.');break;}
    case 'dismiss':if(arm(el,'Dismiss','Sure?'))dismiss(Number(arg));break;
    case 'recruit':recruit(Number(arg));break;
    case 'reroll':{const c=rerollCost();if(S.gold>=c){S.gold-=c;S.rerolls++;refreshBoard();}break;}
    case 'biz':buyBiz(Number(arg),S.buy);break;
    case 'fac':buyFac(arg);break;
    case 'push':S.push=!S.push;if(S.push)S.pushWait=0;break;
    case 'back':if(S.floor>1){S.floor--;S.push=false;spawn();}break;
    case 'relic':if(S.relicPending>0)openModal('relic','Relic',relicHTML());break;
    case 'takerelic':takeRelic(arg,false);if(S.relicPending>0)openModal('relic','Relic',relicHTML());else closeModal();break;
    case 'region':chooseRegion(arg,false);break;
    case 'close':if(modalKind!=='region')closeModal();break;
    case 'staff':S.staff.on[arg]=!S.staff.on[arg];break;
    case 'season':if(arm(el,'End the season','Click again to end it'))newSeason(false);break;
    case 'crest':{const c=CREST.find(x=>x.id===arg),l=S.crest[arg]||0;if(l>=c.max)break;const cost=c.cost(l);if(S.renown<cost)break;S.renown-=cost;S.crest[arg]=l+1;D=derive();log(`Crest: <b>${c.name}</b> level ${l+1}.`);if(arg==='hall')curKey=null;break;}
    case 'save':save();$('#saveMsg').textContent='Saved.';break;
    case 'export':$('#saveTxt').value=exportSave();$('#saveMsg').textContent='Save exported above. Keep a copy somewhere safe.';break;
    case 'copy':{const t=$('#saveTxt');if(!t.value)t.value=exportSave();const fb=()=>{t.select();$('#saveMsg').textContent='Selected. Press Ctrl+C to copy.';};
      try{navigator.clipboard.writeText(t.value).then(()=>$('#saveMsg').textContent='Copied.',fb);}catch(err){fb();}break;}
    case 'import':try{importSave($('#saveTxt').value);closeModal();curKey=null;$('#saveMsg').textContent='Save imported.';}catch(err){$('#saveMsg').textContent="That text isn't a Starfall Guild save. Paste the whole exported block.";}break;
    case 'reset':if(arm(el,'Erase everything','Click again to erase')){S=fresh();boot0();save();closeModal();curKey=null;toast('Everything erased. A new guild opens its doors.');}break;
  }
  updateUI();SND.render();
});
document.addEventListener('change',e=>{if(e.target.id==='autoAt'){S.autoAt=Math.max(1,Math.floor(Number(e.target.value)||1));e.target.value=S.autoAt;}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalKind&&modalKind!=='region')closeModal();});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&modalKind!=='region')closeModal();});

