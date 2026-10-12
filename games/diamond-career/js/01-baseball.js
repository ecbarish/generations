'use strict';
/* A pitch model, not a physics engine. Every simulated pitch uses resolvePitch too.
   This slice has held-runner outs, clean catches and fixed hit advancement: no steals, errors, bunts or double plays. */
function newGame(seed=1) {
  return {seed:seed>>>0,inning:1,half:0,outs:0,bases:[null,null,null],count:{balls:0,strikes:0},score:[0,0],
    order:[0,0],totals:[lineStats(),lineStats()],hero:lineStats(),finished:false,heroPA:0,manual:0,pitches:0,log:[]};
}
function batterOf(g) { const hero=g.half===1 && g.order[1]===0; return {hero,name:hero?'You':DC.teammates[g.order[g.half]]}; }
function scoreRunner(g,r) { if (!r||(g.stopOnWin&&g.score[1]>g.score[0])) return; g.score[g.half]++; g.totals[g.half].runs++; if(r.hero) g.hero.runs++; }
function finishPA(g,kind,batter) {
  const t=g.totals[g.half], h=batter.hero?g.hero:null;
  for(const s of [t,h].filter(Boolean)) { s.pa++; if(kind==='walk')s.walks++; else s.ab++; if(kind==='strikeout')s.k++; if(Number.isInteger(kind)){s.hits++; if(kind===4)s.hr++;} }
  if(batter.hero)g.heroPA++;
  g.order[g.half]=(g.order[g.half]+1)%9; g.count={balls:0,strikes:0};
}
function applyPlay(g,play) {
  if(g.finished) return {ended:false,runs:0};
  const batter=batterOf(g), side=g.half, before=g.score[side]; let kind=play, ended=true;
  if(play==='ball') { if(++g.count.balls<4)return {ended:false,runs:0}; kind='walk'; }
  if(play==='strike') { if(++g.count.strikes<3)return {ended:false,runs:0}; kind='strikeout'; }
  if(play==='foul') { g.count.strikes=Math.min(2,g.count.strikes+1); return {ended:false,runs:0}; }
  g.stopOnWin=side===1&&g.inning>=9&&kind!==4;
  if(kind==='walk') {
    if(g.bases[0]) { if(g.bases[1]) { if(g.bases[2])scoreRunner(g,g.bases[2]); g.bases[2]=g.bases[1]; } g.bases[1]=g.bases[0]; }
    g.bases[0]=batter;
  } else if(Number.isInteger(kind)&&kind>=1&&kind<=4) {
    for(let i=2;i>=0;i--) { const r=g.bases[i]; g.bases[i]=null; if(r) { if(i+kind>=3)scoreRunner(g,r); else g.bases[i+kind]=r; } }
    if(kind===4)scoreRunner(g,batter); else g.bases[kind-1]=batter;
  } else if(['out','strikeout'].includes(kind)) { g.outs++; }
  else throw Error('Unknown play '+play);
  // Non-HR walk-offs stop on the winning run. A home run scores every runner.
  if(side===1&&g.inning>=9&&g.score[1]>g.score[0]) {
    g.finished=true;
  }
  delete g.stopOnWin;
  const runs=g.score[side]-before;
  g.totals[side].rbi+=runs; if(batter.hero)g.hero.rbi+=runs;
  finishPA(g,kind,batter);
  if(g.outs===3&&!g.finished) {
    g.outs=0; g.bases=[null,null,null];
    if(side===0) { if(g.inning>=9&&g.score[1]>g.score[0])g.finished=true; else g.half=1; }
    else if(g.inning>=9&&g.score[1]!==g.score[0])g.finished=true;
    else { g.inning++; g.half=0; }
  }
  return {ended,runs,kind};
}
// Fallback cues can randomly match the true type. Preserve the old Eye-50 baseline.
function cueTruth(stats={discipline:50}) { const eye=Number.isFinite(stats.discipline)?stats.discipline:50;return clamp(.78+(eye-50)*.002,.68,.88); }
function cueAccuracy(stats) { return cueTruth(stats)+(1-cueTruth(stats))/3; }
function makePitch(g,pitcher,stats) {
  const roll=random(g), type=roll<.5?pitcher.favorite:roll<.75?'fastball':roll<.9?'curve':'change-up';
  const inZone=random(g)<.64, truthful=random(g)<cueTruth(stats);
  const hint=truthful?type:Object.keys(DC.pitches)[Math.floor(random(g)*3)];
  return {type,inZone,hint,duration:DC.pitches[type].duration,skill:pitcher.skill,cueChance:cueAccuracy(stats)};
}
function resolvePitch(g,stats,p,action) {
  g.pitches++;
  if(action.take) return {play:p.inZone?'strike':'ball',text:p.inZone?'You let a strike go by.':'Good eye. That pitch missed the zone.'};
  let quality=.38, text='The simulated batter reads the release.';
  const stance=action.stance||'contact';
  if(action.mode==='timing') {
    const delta=action.timing-1,window=action.timingWindow||.10, distance=Math.abs(delta);
    quality=clamp(distance<=window?1-distance*.3/window:.7-(distance-window)*3,0,1);
    text=distance<window?'You met the '+p.type+' on time.':delta<0?'You were early on the '+p.type+'.':'You were late on the '+p.type+'.';
  } else if(action.mode==='tactical') {
    const right=action.guess===p.type; quality=right?.88:.30;
    text=right?'You read the '+p.type+' correctly.':'You expected a '+action.guess+'; it was a '+p.type+'.';
  }
  if(!p.inZone)text+=' That pitch was off the plate; it was harder to reach.';
  const contact=clamp(.51+(stats.contact-50)*.004+(quality-.38)*.20-(p.skill-50)*.003-(stance==='power'?.12:0)-(p.inZone?0:.19),.15,.9);
  if(random(g)>contact)return {play:'strike',text:text+' Swing and miss.'};
  if(random(g)<.20)return {play:'foul',text:text+' Foul; with two strikes, the count stays there.'};
  const hitChance=clamp(.34+(stats.contact-50)*.0025+(quality-.38)*.17+(stance==='contact'?.025:0),.18,.6);
  if(random(g)>hitChance)return {play:'out',text:text+(quality>=.7?' Good contact, but a fielder caught it; runners hold.':' Weak contact. The fielder makes a clean out; runners hold.')};
  const power=clamp(.07+(stats.power-50)*.003+(stance==='power'?.10:0)+(quality-.38)*.05,.02,.28), r=random(g);
  const bases=r<power?4:r<power+.035?3:r<power+.25?2:1;
  return {play:bases,text:text+' '+['','A single through the gap.','A double to the fence.','A triple into the corner.','Home run!'][bases]};
}
function simulatedAction(g,p,stats) {
  const reads=random(g)<clamp(.56+(stats.discipline-50)*.004,.35,.78);
  return {take:reads?!p.inZone:random(g)<.20,stance:'contact',mode:'sim'};
}
function simulateToMoment(g,stats,pitcher,moments=2,finish=false) {
  let guard=0;
  while(!g.finished) {
    const hero=batterOf(g).hero;
    // Two early/later highlights for the development club; signed playing time changes the number to 1 or 3.
    const target=moments===1?1:1+Math.floor(g.manual*7/(moments-1));
    if(!finish&&hero&&g.manual<moments&&g.inning>=target) return;
    if(++guard>50000)throw Error('Game simulation did not finish');
    const s=hero?stats:{contact:55,power:49,discipline:52}, p=makePitch(g,pitcher);
    applyPlay(g,resolvePitch(g,s,p,simulatedAction(g,p,s)).play);
  }
}
