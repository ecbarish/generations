'use strict';
const VERSION='0.4.1'; // Initial prototype; no existing game's version changes.
Arcade.validators[DC.key]=validCareer;
S=migrateCareer(Arcade.load(DC.key));
D=Dialogue.create({host:document.querySelector('#stage'),theme:'diamond',get:()=>sceneState,set:v=>{sceneState=v;document.querySelector('#stage').classList.toggle('coach-speaking',!!v);},cast:who=>careerCast(who),blip:()=>SOUND.sfx('blip',350),onEnd:()=>saveCareer()});
// Diamond Career conversations show complete lines: Continue always advances once.
function showCareerLine() {
  if(!sceneState)return;
  sceneState.shown=sceneState.lines[sceneState.i][1].length;
  D.el.querySelector(".dlg-say").textContent=sceneState.lines[sceneState.i][1];
  D.el.classList.add("ready");
  D.el.scrollTop=0;
}
for(const method of ["play","advance"]) {
  const original=D[method];
  D[method]=function(...args){const result=original(...args);showCareerLine();return result;};
}
setupSound();
Settings.create({mount:'#tools',btnClass:'hbtn',rows:[{label:'Batting style',options:[['timing','Timing · swing on arrival'],['tactical','Tactical · read and choose']],get:()=>S.mode,set:v=>{S.mode=v;if(v==='timing')S.stance=timingStance(S);resetClock();saveCareer();renderCareer();},note:'Switch freely. Your count and the current pitch are preserved.'}]});
setupFeedback('Diamond Career',VERSION,()=>`Day ${S.day}, ${S.phase}, ${S.mode}, game ${S.played+1}, ${S.contract?.offer||'development'}`);
document.querySelector('#content').addEventListener('submit',e=>{
  if(e.target.id!=='creator')return;e.preventDefault();const form=new FormData(e.target);
  if(startCareer(S,form.get('name'),form.get('bats'),form.get('look'))){saveCareer();renderCareer();D.play([['','The last bus leaves Brackenport. The ballpark lights stay on.'],['iona','Six games. Five hits, or getting on base three times in ten chances. Those are our senior call-up targets.'],['iona','You can time your swing or read the pitcher. Settings lets you change. Take the space you need; I will be here.']],()=>{renderCareer();});}
});
document.querySelector('#content').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.stance)chooseStance(b.dataset.stance);
  else if(b.dataset.act)actCareer(b.dataset.act);
});
document.querySelector('#content').addEventListener('change',e=>{if(e.target.id==='guess'){S.guess=e.target.value;saveCareer();}});
document.querySelector('#save-tools').addEventListener('click',()=>{document.querySelector('#save-content').innerHTML=Arcade.saveToolsHTML(DC.key);document.querySelector('#save-dialog').showModal();});
document.querySelector('#close-save').addEventListener('click',()=>document.querySelector('#save-dialog').close());
document.addEventListener('keydown',e=>{
  if(e.repeat||sceneState||careerSheet||document.querySelector('#save-dialog').open||e.target.closest('input,select,textarea,button,a')||document.querySelector('.arc-set-bg:not([hidden])'))return;
  if(!['Space','Enter'].includes(e.code))return;e.preventDefault();
  if(S.phase==='result')actCareer('continue');
  else if(S.phase==='pitch')actCareer(S.mode==='tactical'?'tactical':pitchClock.running?'swing':'ready');
});
addEventListener('pagehide',()=>saveCareer());
document.addEventListener('visibilitychange',()=>{previousFrame=0;});
renderCareer();requestAnimationFrame(animateWorld);
if(S.road&&!S.road.closed&&!roadReady(S)&&S.phase==='home')playBusTrip();
if(location.hostname==='localhost')window.__dc={get S(){return S;},set S(v){S=v;resetClock();renderCareer();},DC,swingWindow,cueAccuracy,cueTruth,timingStance,chooseStance,newGame,applyPlay,makePitch,resolvePitch,simulateToMoment,simulatedAction,batterOf,freshCareer,migrateCareer,validCareer,startCareer,startMatch,playPitch,continueMatch,afterMatch,training,signContract,advanceDays,purchase,evaluation,saveCareer,renderCareer,actCareer,random,lineStats,DC_TRACKS,contractOffer,termEnd,calendarStatus,beginSeries,finishMonth,careerPhase,beginRoadMonth,nextRoadSeries,chooseBus,roadReady,ROAD_TOWNS,ROAD_OFFERS,localGreeting,currentPeriod,effectiveStats,openCareerSheet,get clock(){return pitchClock;},get D(){return D;}};
