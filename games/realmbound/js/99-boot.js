'use strict';
const VERSION = '1.8.1'; // the game's version (L9): bump it on release, see HANDOFF.md "Releasing a version"
/* =================== boot =================== */
function boot(){
  clearRealmRoad();
  closeRealmNotebook(false);
  clearArrival(); clearMemberStory(); clearTownService();
  const h=H();
  SND.render();renderGfxBtn();
  if(!h){closeModal();if(S.chars.length)openModal('chars',charsHTML());else{CR.name=pick(NAMES);openModal('create',createHTML());}return;}
  h.log=h.log||[];h.addons=h.addons||{unl:{},on:{}};h.avg=h.avg||{cycle:30,xp:20,money:5};
  for(const k of ['kills','deaths','loots','junkSold','quests','equips','manual','uses','play','money','feeds','tamed'])h.stats[k]=h.stats[k]||0;
  h.pets=h.pets||[];if(h.activePet===undefined)h.activePet=null;h.riding=h.riding||0;h.mounts=h.mounts||[];if(h.mount===undefined)h.mount=null;
  if(!h.npcs)h.npcs=genNpcs(h.faction);h.party=h.party||[];if(h.dun===undefined)h.dun=null;migrateDungeons(h);
  recalc();C=freshC();C.hp=h.cur?Math.min(ST.hpMax,h.cur.hp):ST.hpMax;C.res=h.cur?Math.min(ST.resMax,h.cur.res):(CLASSES[h.cls].res==='mana'?ST.resMax:0);if(C.hp<=0)C.hp=ST.hpMax*.5;
  syncParty();
  closeModal();curKey=null;buildSlots();supplyCheckIn();updateWorld();beginArrival(false);
}
/* test hook, local dev server only */
if(location.hostname==='localhost')window.__rb={get S(){return S;},get C(){return C;},petStats,petOf,newHero,boot,gainXP,xpNeed,startDungeon,spawnDungeon,finishDungeon,dungeonStats,migrateDungeons,questHelper,qState,accept,turnIn,ZONES,QUESTS,DUNGEONS,npcZone,step,save,spawn,startTame,finishTame,migrate,TALENTS,TALENT_LIST,treePoints,heroRole,respecCost,respec,talentPoints,bar,get ST(){return ST;}};
let started=false;
function start(data){
  if(started)return;started=true;let away=null;
  if(data&&data.S){S=migrate(data.S);boot();}else{S=migrate(Arcade.load(KEY));boot();if(H())away=offline((Date.now()-(H().lastPlayed||S.last||Date.now()))/1000,true);}
  if(away&&(away.kills||away.rested>0)&&H())openModal('offline',offlineHTML(away));
  if(window.claude&&window.claude.hot&&window.claude.hot.snapshot){try{window.claude.hot.snapshot(()=>({S:JSON.parse(JSON.stringify(S))}));}catch(e){}}
  setupFeedback('Realmbound', VERSION, () => { const h = H(); if (!h) return 'Not started'; return `${ZONES[h.zone] ? ZONES[h.zone].name : h.zone}, level ${h.lvl} ${CLASSES[h.cls] ? CLASSES[h.cls].name : h.cls}`; }); // the Feedback menu (shared/feedback.js)
  resize();
  let lastT=performance.now(),uiT=0,chk=0;
  setInterval(()=>{const t=performance.now();let dt=(t-lastT)/1000;lastT=t;if(!H()||!C)return;
    if(dt>60){const r=realmRoadActive()?null:offline(dt);if(r&&!modalKind)openModal('offline',offlineHTML(r));dt=0;}
    let guard=0;while(dt>0&&guard++<700){const st=Math.min(.1,dt);dt-=st;step(st);}
    if(!realmRoadActive()&&H().addons.unl.questhelper&&H().addons.on.questhelper)questHelper();
    chk+=.1;if(chk>=1){chk=0;checkAddons();supplyTick();}
    uiT+=.1;if(uiT>=.1){uiT=0;updateWorld();}},100);
  setInterval(save,10000);addEventListener('beforeunload',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  requestAnimationFrame(frame);
}
if(window.claude&&window.claude.hot&&window.claude.hot.ready)window.claude.hot.ready(start);
else start(window.claude&&window.claude.hot&&window.claude.hot.data||{});
