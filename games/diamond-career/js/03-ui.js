'use strict';
let S, D, sceneState=null, SOUND, pitchClock={elapsed:0,running:false}, contactAt=0;
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn = (act,label,primary=false,disabled=false) => `<button data-act="${act}" ${disabled?'disabled':''} class="${primary?'primary':''}">${label}</button>`;
function saveCareer() {
  if(!S.player)return;
  document.querySelector('#save-warning').hidden=Arcade.save(DC.key,S);
  Arcade.report('baseball',{summary:`${S.player.name} · ${S.contract?S.contract.tier:DC.club}`,detail:`Day ${S.day} · ${S.record.hits} hits · ${money(S.cash)} · ${S.owned.car?'Own car':S.owned.apartment?'Own apartment':'First season'}`});
}
function resetClock() { pitchClock={elapsed:0,running:false}; }
function timingStance(s) { return s.stance==='power'?'power':'contact'; }
function chooseStance(stance) {
  if(sceneState||S.phase!=='pitch'||pitchClock.running||!['contact','power',...(S.mode==='tactical'?['patience']:[])].includes(stance))return false;
  S.stance=stance;saveCareer();renderCareer();return true;
}
function renderCareerContent() {
  if(S.mode==='timing')S.stance=timingStance(S);
  renderBattingWindow();
  const el=document.querySelector('#content'),g=S.active&&S.active.g;
  document.querySelector('#place').textContent=['home','month'].includes(S.phase)?'BRACKENPORT · YOUR CORNER OF THE WORLD':['clubhouse','offers'].includes(S.phase)?'THE LANTERNS CLUBHOUSE':'LAMPLIGHT FIELD · BRACKENPORT';
  document.querySelector('#scoreboard').innerHTML=g?`<div class="score-teams"><span>${esc(S.active.opponent.split(' ').slice(-1)[0])} <b>${g.score[0]}</b></span><span>${esc((S.contract?contractOffer(S.contract).name:DC.club).split(' ').slice(-1)[0])} <b>${g.score[1]}</b></span></div><div>${g.finished?'FINAL':(g.half?'Bottom':'Top')+' '+g.inning} · ${g.outs} out${g.outs===1?'':'s'}</div><div class="score-count"><span>${g.count.balls} balls · ${g.count.strikes} strikes</span><span aria-label="Bases, first through third">${g.bases.map((b,i)=>`<i class="base ${b?'on':''}" title="${i+1}: ${b?'occupied':'empty'}"></i>`).join('')}</span></div>`:`<div class="eyebrow">${S.month?'Your first season month':'The first call-up'}</div><b>${esc(S.contract?contractOffer(S.contract).name:DC.club)}</b><div>${S.month?'Day '+Math.min(30,S.day-S.month.start+1)+' of 30 · '+S.month.games+' games':'Six games · your first chance'}</div>`;
  document.querySelector('#timing-bar').hidden=S.phase!=='pitch'||S.mode!=='timing';
  if(S.phase==='creator') {
    el.innerHTML=`<div class="eyebrow">An original baseball career</div><h1>The lights are on.<br>Your name is next.</h1><p>Six games at Lamplight Field. Earn your first call-up, choose a contract, and bring your first payday home.</p><form id="creator"><label for="player-name">Your name</label><input id="player-name" name="name" maxlength="24" value="Rookie" autocomplete="off" required><label for="bats">Batting hand</label><select id="bats" name="bats"><option value="right">Right-handed</option><option value="left">Left-handed</option></select><label for="look">Your look</label><select id="look" name="look">${DC.looks.map((l,i)=>`<option value="${i}">${l.name}</option>`).join('')}</select><p class="muted">A batter, just starting out. Change batting style anytime in Settings.</p><button class="primary" type="submit">Meet the coach</button></form>`;
    return;
  }
  const header=`<div class="eyebrow">Day ${S.day} · ${S.contract?esc(contractOffer(S.contract).role):'Development series'}</div><h1>${esc(S.player.name)}</h1>`;
  const stats=`<div class="stats"><span>Contact ${S.stats.contact}</span><span>Power ${S.stats.power}</span><span>Eye ${S.stats.discipline}</span><span>Fatigue ${S.fatigue}</span></div>`;
  if(S.phase==='pitch') {
    const p=S.active.pitch;
    el.innerHTML=`${header}<h2>Step into the box.</h2><p class="pitch-read">${esc(S.active.pitcher.name)} favors the ${S.active.pitcher.favorite}. This release shows ${DC.pitches[p.hint].cue}. A clue, not a promise.</p><div class="stats"><span>Game ${S.played+1}/6</span><span>${S.mode==='timing'?'Timing':'Tactical'} batting</span><span>${g.manual+1} of up to ${S.contract?contractOffer(S.contract).moments:2} key at-bats</span></div>`+
      (S.mode==='timing'?`<p>Your swing choice, pitch clue and controls are on the field. Space or Enter readies the pitch, then swings. Let it go if you want to take it.</p>`:
      `<fieldset><legend>Your approach</legend><div class="actions">${['patience','contact','power'].map(x=>`<button class="${S.stance===x?'selected':''}" data-stance="${x}" aria-pressed="${S.stance===x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join('')}</div></fieldset><label for="guess">Read the pitch</label><select id="guess">${Object.keys(DC.pitches).map(x=>`<option ${S.guess===x?'selected':''}>${x}</option>`).join('')}</select><p class="muted">Patience judges the zone using your eye. Contact favors getting aboard; power trades contact for extra bases.</p><div class="actions">${btn('tactical','Commit to your read',true)}${btn('take','Let it go')}</div>`)+`<details><summary>How baseball works here</summary><p>Four balls earn a walk. Three strikes make an out. A foul cannot be strike three. Three outs switch sides. Runs count when runners reach home. Nine innings, with extras for a tie.</p><p>You play key at-bats. Teammates, opponents and your other turns use the same pitch model. This first slice has no steals, errors or double plays; runners hold on clean outs.</p></details>`;
  } else if(S.phase==='result') {
    el.innerHTML=`${header}<div class="eyebrow">${S.active.last.ended?'At-bat complete':'Same at-bat'}</div><h2 class="result" role="status">${esc(S.active.last.text)}</h2><p>${S.active.last.runs?S.active.last.runs+' run'+(S.active.last.runs===1?'':'s')+' scored.':'The scoreboard is up to date.'}</p><p class="muted">${S.active.last.ended?'The rest of the field plays on. Your next moment waits for you.':'The count stays with you. Take a breath before the next pitch.'}</p><p class="muted">Continue from the result on the field, or press Space or Enter.</p>`;
  } else if(S.phase==='summary') {
    const h=g.hero;
    el.innerHTML=`${header}<h2>${g.score[1]>g.score[0]?'The clubhouse is buzzing.':'Tomorrow is another game.'}</h2><p>${esc(S.active.opponent)} ${g.score[0]} · ${esc(S.contract?contractOffer(S.contract).name:DC.club)} ${g.score[1]}. ${g.inning} innings.</p><div class="card"><h3>Your full game</h3><p>${h.hits} for ${h.ab} · ${h.walks} walk${h.walks===1?'':'s'} · ${h.rbi} RBI · ${h.hr} home runs.</p><p class="muted">You played ${g.manual} key at-bat${g.manual===1?'':'s'}. Other turns and both teams simulated pitch by pitch.</p></div><p>${evaluation(S).text}</p>${btn('after','Back to the clubhouse',true)}`;
  } else if(S.phase==='month') {
    const m=S.month,total=S.ledger.filter(e=>e.amount>0).reduce((n,e)=>n+e.amount,0);
    el.innerHTML=`${header}<h2>A month with your name on it.</h2><p class="quote">Iona: “A career is more than one score. Look at the road you made, then take a breath.”</p><div class="card"><h3>Days ${m.start}–${m.end-1}</h3><p>${m.games} games · ${m.wins} wins for your clubs · ${m.record.hits} hits · ${m.record.walks} walks.</p><p>Month average ${rate(average(m.record))} · on-base ${rate(onBase(m.record))}.</p><p>Career income ${money(total)} · cash remaining ${money(S.cash)}. Your purchases stay yours.</p></div>${Object.entries(DC.purchases).map(([id,p])=>`<article class="card offer"><h3>${p.name}</h3>${btn('buy-'+id,S.owned[id]?'Yours, permanently':'Buy · '+money(p.price),false,S.owned[id]||S.cash<p.price)}</article>`).join('')}<p class="muted">This playable chapter ends here. No calendar runs in the background, and there is no upkeep. Your batting record, contracts, wallet and home are saved for the next chapter.</p>${notebookHTML()}`;
  } else if(S.phase==='offers') {
    const e=evaluation(S),renewal=!!S.contract,offers=renewal?DC.renewals:DC.offers;
    el.innerHTML=`${header}<h2>${renewal?'Your next contract.':e.earned?'Your first call-up.':'A place to keep growing.'}</h2><p class="quote">Iona: “${renewal?'Your first term is paid. Stay with your club or take a new shirt; neither choice erases your work.':e.earned?'You earned this. Now decide what matters more: a bigger cheque, or your name on the lineup every day.':'Not quite the senior target yet. Both clubs offer paid development places. You can earn the call-up in your next series.'}”</p><p>${e.text}</p>${renewal?'<p>A 24-day term finishes the month. Two six-game series, one game every two calendar days; you can also choose quiet days. Salary is guaranteed by date, not hits.</p>':''}${Object.entries(offers).map(([id,o])=>`<article class="card offer"><h3>${o.name}</h3><b>${o.role}</b><p>${money(o.bonus)} signing bonus + ${money(o.wage)} on days ${o.days.map(d=>S.day+d).join(', ')}.</p><p>Stated value: ${money(o.bonus+o.wage*o.days.length)}. Term ends day ${S.day+(renewal?24:6)}.</p><p>${o.moments} playable key at-bat${o.moments===1?'':'s'} per game. All your remaining turns simulate.</p>${btn('sign-'+id,'Choose '+o.role,true)}</article>`).join('')}${notebookHTML()}`;
  } else {
    const o=S.contract&&contractOffer(S.contract),cal=calendarStatus(S);
    el.innerHTML=`${header}<h2>${S.contract?'A life beyond the line.':'The coach leaves a light on.'}</h2><p class="quote">${esc(S.message)}</p>${stats}<p class="muted">${evaluation(S).text} Training helps your odds; nothing guarantees a hit.</p>`+
      (S.contract&&contractDue(S)?`${btn('finish-month','Close the month',true)}`:S.played<6?`${!S.prepared?`<h3>One preparation before the game</h3><div class="actions">${btn('train-contact','Contact +2')}${btn('train-power','Power +2')}${btn('train-discipline','Eye +2')}${btn('rest','Rest')}</div>`:'<p>Preparation done. Time for the field.</p>'}${btn('match','Play game '+(S.played+1)+' of 6',true)}`:S.contract?`${btn('new-series','Begin another six-game series',true)}`:'')+
      (o?`<h3>${money(S.cash)} to make your own</h3><p>${esc(o.name)} · ${esc(S.contract.tier)} · ${o.moments} key at-bats per game.</p><div class="actions">${btn('day','Spend a quiet day at home',false,!!S.month&&S.day>=S.month.end)}</div><p class="muted">Salary: ${money(o.wage)} on calendar days ${o.days.map(d=>S.contract.start+d).join(', ')}. ${o.days.length} payments · ${cal.paid} paid. Stated value ${money(cal.total)}. ${cal.next?'Next: '+money(cal.next.amount)+' on day '+cal.next.day+'.':'All salary paid.'} Term ends day ${cal.end}; no daily upkeep.</p>${Object.entries(DC.purchases).map(([id,p])=>`<article class="card offer"><h3>${p.name}</h3><p>${id==='apartment'?'A warm room, a sofa and your own shirt on the wall.':'Your own car in the garage. A permanent milestone, with no running costs.'}</p>${btn('buy-'+id,S.owned[id]?'Yours, permanently':'Buy · '+money(p.price),false,S.owned[id]||S.cash<p.price)}</article>`).join('')}<details><summary>Your salary ledger · ${S.ledger.length} entries</summary><table class="ledger"><tbody>${S.ledger.map(e=>`<tr><td>Day ${e.day}<br>${esc(e.label)}</td><td>${e.amount<0?'−':'+'}${money(Math.abs(e.amount))}</td></tr>`).join('')}</tbody></table></details>`:'')+
      `<details><summary>Your notebook</summary>${decisionHTML()}<p>Contact helps you put the ball in play. Power improves extra-base chances. Eye helps judge the zone when you choose Patience, and makes future pitch cues more reliable. Fatigue reduces contact; rest clears it.</p><p>On-base means hits plus walks divided by plate appearances. Career: ${S.record.hits} hits in ${S.record.ab} at-bats, ${S.record.walks} walks, average ${rate(average(S.record))}.</p>${S.history.slice(-6).map(h=>`<p class="muted">Day ${h.day} · ${esc(h.opponent)} ${h.score[0]}–${h.score[1]} · ${h.hero.hits}/${h.hero.ab}</p>`).join('')}</details>`;
  }
  SOUND&&SOUND.render();
}
function actCareer(act) {
  if(sceneState||(careerSheet&&['ready','swing','take','tactical','continue'].includes(act)))return;
  if(act==='start-road') { if(beginRoadMonth(S)){saveCareer();renderCareer();playBusTrip();} return; }
  if(act==='bus') {playBusTrip();return;}
  let changed=false;
  if(act==='ready'&&S.phase==='pitch'&&S.mode==='timing'&&!pitchClock.running){S.stance=timingStance(S);pitchClock.running=true;pitchClock.elapsed=0;renderBattingWindow();return;}
  if(['swing','tactical','take'].includes(act)) {
    if(S.phase!=='pitch'||(S.mode==='timing'&&!pitchClock.running))return;
    let take=act==='take';
    if(act==='tactical'&&S.stance==='patience') { const p=S.active.pitch;take=random(S.active.g)<clamp(.58+(S.stats.discipline-50)*.006,.4,.85)?!p.inZone:random(S.active.g)<.3; }
    changed=!!playPitch(S,{take,mode:S.mode,timing:pitchClock.elapsed/S.active.pitch.duration,stance:S.mode==='timing'?timingStance(S):S.stance,guess:S.guess});
    if(changed){contactAt=performance.now();SOUND.sfx(typeof S.active.last.play==='number'?'hit':S.active.last.play==='ball'?'select':'miss');}
  } else if(act==='continue')changed=continueMatch(S);
  else if(act==='after')changed=afterMatch(S);
  else if(act==='match')changed=startMatch(S);
  else if(act==='rest')changed=training(S,'rest');
  else if(act.startsWith('train-'))changed=training(S,act.slice(6));
  else if(act.startsWith('sign-')){changed=signContract(S,act.slice(5));if(changed)SOUND.sfx('level');}
  else if(act.startsWith('buy-')){changed=purchase(S,act.slice(4));if(changed)SOUND.sfx('coin');}
  else if(act==='day'&&S.phase==='home'){advanceDays(S,1);S.phase=careerPhase(S);S.message='A quiet day at home. Any salary due today is in your ledger.';changed=true;}
  else if(act==='finish-month')changed=finishMonth(S);
  else if(act==='new-series')changed=beginSeries(S);
  if(changed){resetClock();saveCareer();renderCareer();if(act==='new-series'&&S.road)playBusTrip();if(act==='rest'||act.startsWith('train-'))D.play([[act==='rest'?'':'iona',act==='train-contact'?'A clean swing, not a hurried one. Practice putting the barrel where you mean it to be.':act==='train-power'?'Use your legs before your arms. Power has a cost; keep contact in the conversation.':act==='rest'?'An evening without another drill. Your legs feel fresh again.':S.message.replace(/^Iona: “|”$/g,'')]],()=>{renderCareer();openCareerSheet('coach');});}
}

function decisionHTML(){return S.notes.map(n=>`<p class="quote">Day ${n.day} · ${esc(n.text)}</p>`).join('');}
function notebookHTML(){return `<details><summary>Iona's notebook · your road</summary>${decisionHTML()||'<p>No decisions noted yet. Your full game history is still recorded.</p>'}<p>Career: ${S.record.hits} hits in ${S.record.ab} at-bats, ${S.record.walks} walks, average ${rate(average(S.record))}.</p>${S.contracts.map(c=>`<p>First term: ${esc(contractOffer(c).name)} · day ${c.start}–${termEnd(c)-1} · ${esc(c.tier)}.</p>`).join('')}</details>`;}
