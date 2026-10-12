'use strict';
function freshCareer(seed=Date.now()) {
  return {game:'diamond-career',schema:1,seed:seed>>>0,player:null,mode:'timing',sound:0,phase:'creator',day:1,
    series:0,played:0,stats:{contact:58,power:50,discipline:55},fatigue:0,record:lineStats(),season:lineStats(),
    history:[],contract:null,ledger:[],cash:0,owned:{apartment:false,car:false},active:null,message:'',stance:'contact',guess:'fastball',prepared:false,month:null,contracts:[],notes:[],road:null,visits:{}};
}
function validCareer(o) {
  const num=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0, line=s=>!!s&&Object.keys(lineStats()).every(k=>num(s[k]));
  if(!o||o.game!=='diamond-career'||o.schema!==1||!Number.isInteger(o.day)||o.day<1||!num(o.cash)||
    !o.stats||!['contact','power','discipline'].every(k=>num(o.stats[k]))||!line(o.record)||!line(o.season)||
    !o.owned||!['apartment','car'].every(k=>typeof o.owned[k]==='boolean')||!Array.isArray(o.ledger)||!Array.isArray(o.history)||
    !o.ledger.every(e=>e&&typeof e.id==='string'&&Number.isFinite(e.amount)&&Number.isInteger(e.day)&&e.day>=1))return false;
  if(o.contract&&o.contract.generation!==undefined&&![0,1,2].includes(o.contract.generation))return false;
  if(o.month!==undefined&&o.month!==null&&(!Number.isInteger(o.month.start)||o.month.start<1||o.month.end!==o.month.start+30||!Number.isInteger(o.month.games)||o.month.games<0||!Number.isInteger(o.month.wins)||o.month.wins<0||o.month.wins>o.month.games||!line(o.month.record)||typeof o.month.closed!=='boolean'))return false;
  if(o.contracts!==undefined&&(!Array.isArray(o.contracts)||o.contracts.length>2||!o.contracts.every(c=>c&&DC.offers[c.offer]&&Number.isInteger(c.start)&&c.start>=1&&[0,1].includes(c.generation))))return false;
  if (!validRoadFields(o)) return false;
  if(o.notes!==undefined&&(!Array.isArray(o.notes)||o.notes.length>6||!o.notes.every(n=>n&&Number.isInteger(n.day)&&n.day>=1&&typeof n.kind==='string'&&typeof n.text==='string')))return false;
  if(o.player&&(typeof o.player.name!=='string'||!['left','right'].includes(o.player.bats)||!Number.isInteger(o.player.look)||o.player.look<0||o.player.look>3))return false;
  if(o.contract&&(!DC.offers[o.contract.offer]||!Number.isInteger(o.contract.start)||o.contract.start<1))return false;
  if(o.active){const g=o.active.g;
    if(!g||!Number.isInteger(g.inning)||g.inning<1||![0,1].includes(g.half)||!Number.isInteger(g.outs)||g.outs<0||g.outs>2||
      !Array.isArray(g.bases)||g.bases.length!==3||!Array.isArray(g.score)||g.score.length!==2||!g.score.every(num)||
      !g.count||!Number.isInteger(g.count.balls)||g.count.balls<0||g.count.balls>3||!Number.isInteger(g.count.strikes)||g.count.strikes<0||g.count.strikes>2||
      !Array.isArray(g.order)||g.order.length!==2||!g.order.every(n=>Number.isInteger(n)&&n>=0&&n<9)||
      !Array.isArray(g.totals)||g.totals.length!==2||!g.totals.every(line)||!line(g.hero)||
      !o.active.pitcher||!DC.pitches[o.active.pitcher.favorite])return false;
    if(o.phase==='pitch'&&(!o.active.pitch||!DC.pitches[o.active.pitch.type]||!DC.pitches[o.active.pitch.hint]))return false;
    if(o.phase==='result'&&(!o.active.last||typeof o.active.last.text!=='string'))return false;
  }
  return true;
}
function migrateCareer(o) {
  const n=freshCareer(1234);
  if(!o||typeof o!=='object'||Array.isArray(o)|| (o.game&&o.game!=='diamond-career'))return n;
  // Early/empty saves get every new field; do not copy arbitrary objects into live state.
  for(const k of Object.keys(n))if(o[k]!==undefined)n[k]=copy(o[k]);
  n.game='diamond-career';n.schema=1;
  n.mode=['timing','tactical'].includes(n.mode)?n.mode:'timing'; n.sound=[0,1,2].includes(n.sound)?n.sound:0;
  n.stance=['contact','power',...(n.mode==='tactical'?['patience']:[])].includes(n.stance)?n.stance:'contact';
  n.stats={...freshCareer().stats,...(n.stats||{})}; n.owned={apartment:false,car:false,...(n.owned||{})};
  n.record={...lineStats(),...(n.record||{})}; n.season={...lineStats(),...(n.season||{})};
  if(n.player&&n.player.look===undefined)n.player.look=0;
  if(!validCareer(n))return freshCareer(1234);
  if(!n.player){n.phase='creator';n.active=null;}
  else if(!['clubhouse','pitch','result','summary','offers','home','month'].includes(n.phase)){n.phase='clubhouse';n.active=null;}
  if(['pitch','result','summary'].includes(n.phase)&&!n.active){n.phase=n.contract?'home':'clubhouse';}
  normalizeCalendar(n,o);
  return n;
}
function effectiveStats(s) { return {...s.stats,contact:Math.max(25,s.stats.contact-s.fatigue*.15),discipline:s.stats.discipline+(s.road?.film?3:0)}; }
function evaluation(s) {
  const obp=onBase(s.season), earned=s.season.hits>=DC.threshold.hits||obp>=DC.threshold.obp;
  return {earned,text:`${s.season.hits} hits · on-base ${rate(obp)}. Call-up target: 5 hits OR .300 on-base across six games.`};
}
function startCareer(s,name,bats,look) {
  if(s.player)return false;
  s.player={name:String(name).trim().slice(0,24)||'Rookie',bats:['left','right'].includes(bats)?bats:'right',look:clamp(+look||0,0,3)};
  s.phase='clubhouse';s.message='Iona Vale: “Six games. Find your eye, then find your swing. A walk counts as getting there.”';return true;
}
function startMatch(s) {
  if(!['clubhouse','home'].includes(s.phase)||s.played>=6||(s.contract&&contractDue(s))||(currentPeriod(s)&&s.day>=currentPeriod(s).end)|| (s.road&&!roadReady(s)))return false;
  const p=DC.pitchers[s.played%3],g=newGame((random(s)*4294967296)>>>0);
  const club=s.contract?contractOffer(s.contract).name:DC.club;
  const opponents=[DC.club,...DC.opponents].filter(name=>name!==club);
  s.active={g,pitcher:p,opponent:s.road?ROAD_TOWNS[s.road.index].club:opponents[s.played%3],park:s.road?ROAD_TOWNS[s.road.index].id:'home',pitch:null,last:null,accounted:false};
  s.prepared=false;
  simulateToMoment(g,effectiveStats(s),p,s.contract?contractOffer(s.contract).moments:2);
  s.phase=g.finished?'summary':'pitch';if(s.phase==='summary')accountMatch(s);else nextPitch(s);return true;
}
function nextPitch(s) { if(!s.active||s.active.g.finished)return; s.active.pitch=makePitch(s.active.g,s.active.pitcher,effectiveStats(s));s.phase='pitch'; }
// Only the opening three games teach arrival timing; subsequent series retain the original challenge.
function swingWindow(s) { return s.series===0&&!s.contract?[.32,.22,.15][s.played]||.10:.10; }
function playPitch(s,action) {
  if(s.phase!=='pitch'||!s.active.pitch)return false;
  const a=s.active, r=resolvePitch(a.g,effectiveStats(s),a.pitch,{...action,timingWindow:swingWindow(s)}), board=applyPlay(a.g,r.play);
  a.last={...r,...board,take:!!action.take};a.pitch=null;s.phase='result';
  if(board.ended)a.g.manual++;
  if(board.ended&&board.kind==='walk'&&action.take)rememberDecision(s,'walk','Waited out an out-of-zone pitch and earned a walk.');
  if(!action.take&&r.play==='strike'&&action.mode==='timing'&&action.timing<1-swingWindow(s))rememberDecision(s,'early','Swung early before the ball reached the plate.');
  return a.last;
}
function continueMatch(s) {
  if(s.phase!=='result')return false;
  const a=s.active;
  if(a.last.ended)simulateToMoment(a.g,effectiveStats(s),a.pitcher,s.contract?contractOffer(s.contract).moments:2);
  if(a.g.finished){s.phase='summary';accountMatch(s);}else nextPitch(s);return true;
}
function accountMatch(s) {
  const a=s.active;if(a.accounted)return;
  a.accounted=true;s.played++;s.fatigue=clamp(s.fatigue+8,0,50);
  for(const k of Object.keys(lineStats())){s.record[k]+=a.g.hero[k];s.season[k]+=a.g.hero[k];}
  s.history.push({series:s.series,day:s.day,opponent:a.opponent,score:copy(a.g.score),hero:copy(a.g.hero),manual:a.g.manual,innings:a.g.inning});
  if(s.history.length>60)s.history.shift();
  const period=currentPeriod(s);
  if(period&&s.contract&&!period.closed){period.games++;if(a.g.score[1]>a.g.score[0])period.wins++;for(const k of Object.keys(lineStats()))period.record[k]+=a.g.hero[k];}
  if(s.road)s.road.film=false;
}
function afterMatch(s) {
  if(s.phase!=='summary')return false;
  const a=s.active;advanceDays(s,s.contract&&s.contract.generation===1?2:1);s.active=null;
  if(s.contract&&s.played===6&&evaluation(s).earned)s.contract.tier='Senior club';
  s.phase=careerPhase(s);
  s.message=s.phase==='offers'?'Iona: “Numbers tell part of your story. Now choose where you will grow.”':coachGame(s,a);return true;
}
function training(s,choice) {
  if(!['home','clubhouse'].includes(s.phase)||s.prepared)return false;
  if(choice==='rest'){if(s.fatigue>0)rememberDecision(s,'rest','Rested tired legs before returning to the field.');s.fatigue=0;s.message='A quiet evening. Your legs feel fresh again.';}
  else if(['contact','power','discipline'].includes(choice)){
    const before=s.stats[choice],chance=cueAccuracy(s.stats);
    s.stats[choice]=Math.min(80,before+2);s.fatigue=Math.max(0,s.fatigue-4);
    s.message='A focused session: '+choice+' +'+(s.stats[choice]-before)+'.';
    if(choice==='discipline'){
      s.message='Iona: “Eye '+before+' → '+s.stats.discipline+'. Your next pitch cues match the pitch about '+(cueAccuracy(s.stats)*100).toFixed(1)+'% of the time'+(s.stats.discipline>before?', up from '+(chance*100).toFixed(1)+'%':'; you are at this chapter’s training limit')+'. A clue, never a promise.”';
      rememberDecision(s,'eye',s.message);
    }
  }
  else return false;
  // One useful preparation per game; choosing again is not an infinite stat button.
  s.prepared=true;return true;
}
function credit(s,id,amount,label,day) {
  if(s.ledger.some(e=>e.id===id))return false;
  s.cash+=amount;s.ledger.push({id,day,amount,label});return true;
}
function signContract(s,offer) {
  if(s.phase!=='offers'||!DC.offers[offer]||(s.contract&&(!contractDue(s)||s.contract.generation===1))||(s.month&&s.day>=s.month.end))return false;
  const renewal=!!s.contract,e=evaluation(s),o=(renewal?DC.renewals:DC.offers)[offer];
  if(renewal){advanceDays(s,0);s.contracts.push(copy(s.contract));}
  const tier=renewal?s.contract.tier:(e.earned?'Senior club':'Development club');
  s.contract={offer,start:s.day,tier,generation:renewal?1:0};
  if(!s.month)s.month={start:s.day,end:s.day+30,games:0,wins:0,record:lineStats(),closed:false};
  credit(s,renewal?'contract-1-signing':'signing',o.bonus,(renewal?'Second contract bonus':'Signing bonus')+' · '+o.name,s.day);
  s.series++;s.played=0;s.season=lineStats();s.prepared=false;s.phase='home';
  s.message=renewal?'Iona: “A new shirt or the same locker. The next contract is your choice. The month is still yours to play.”':e.earned?'Your first call-up. A key, a shirt with your name, and a place to belong.':'A paid development contract. Your call-up target stays in the notebook; there is time to grow.';return true;
}
function advanceDays(s,n) {
  n=Number.isFinite(n)?clamp(Math.floor(n),0,30):0;const period=currentPeriod(s),to=period?Math.max(s.day,Math.min(period.end,s.day+n)):s.day+n;
  if(s.contract){const o=contractOffer(s.contract);o.days.forEach((offset,i)=>{const day=s.contract.start+offset;if(day<=to)credit(s,salaryId(s.contract,i),o.wage,'Salary '+(i+1)+' of '+o.days.length+' · '+o.role,day);});}
  s.day=to;return s.day;
}
function purchase(s,id) {
  const p=DC.purchases[id];if(!s.contract||!p||s.owned[id]||s.cash<p.price)return false;
  s.cash-=p.price;s.owned[id]=true;s.ledger.push({id:'buy-'+id,day:s.day,amount:-p.price,label:p.name});
  s.message=id==='car'?'Your own keys. No rental clock, no repair bill. The road to the park is yours.':'Sun on the windowsill. You hang your first club shirt where you can see it.';return true;
}
