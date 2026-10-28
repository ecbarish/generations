'use strict';
const VERSION = '1.0.2'; // the game's version (L9): bump it on release, see HANDOFF.md "Releasing a version"

/* ================= boot ================= */
function boot0(){D=derive();if(!S.party.length&&S.stats.recruits===0&&!S.regionOffer){S.party.push(makeAdv(1,'swordsman'));S.party[0].name='Ren';log('The Starfall Guild opens its doors. <b>Ren</b> signs up first.');}
  D=derive();if(!S.board.length)refreshBoard();if(!S.php)S.php=D.pmax;spawn();}
let started=false;
if(location.hostname==='localhost')window.__sg={
  get S(){return S;},get D(){return D;},
  save,load,advance,recruit,buyBiz,levelUp,newSeason,chooseRegion
};
function start(data){
  if(started)return;started=true;let away=null;
  if(data&&data.S){S=merge(data.S);D=derive();}else{const o=load();S=merge(o);D=derive();if(o)away=offline((now()-(S.last||now()))/1000);}
  boot0();S.last=now();
  if(window.claude&&window.claude.hot&&window.claude.hot.snapshot){try{window.claude.hot.snapshot(()=>({S:JSON.parse(JSON.stringify(S))}));}catch(e){}}
  setupFeedback('Starfall Guild', VERSION, () => { if (!S || !S.stats) return 'Not started'; const r = REGIONS[S.region]; return `${r ? r.name : S.region}, season ${S.stats.seasons + 1}, floor B${S.floor}F`; }); // the Feedback menu (shared/feedback.js)
  resize();renderTab(true);updateUI();SND.render();
  if(away&&away.gain>0&&!S.regionOffer)openModal('offline','Welcome back',offlineHTML(away));
  let lastT=performance.now(),uiT=0;
  setInterval(()=>{const t=performance.now(),dt=(t-lastT)/1000;lastT=t;
    if(dt>60){const r=offline(dt);if(r&&r.gain>0&&!modalKind)openModal('offline','Welcome back',offlineHTML(r));}else advance(dt);
    uiT+=dt;if(uiT>=0.2){uiT=0;updateUI();}},100);
  setInterval(save,10000);addEventListener('beforeunload',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  requestAnimationFrame(frame);
}
if(window.claude&&window.claude.hot&&window.claude.hot.ready)window.claude.hot.ready(start);
else start(window.claude&&window.claude.hot&&window.claude.hot.data||{});
