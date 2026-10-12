'use strict';
/* T36: native buttons anchored to scene objects; paperwork opens over the world and can be put away. */
let careerSheet=null,careerRoom='clubhouse',lastCareerPhase=null,lastSheetButton=null;
const worldObject=(view,label,x,y)=>`<button data-sheet="${view}" style="--x:${x}%;--y:${y}%">${label}</button>`;
function preparationHTML() {
  if(S.road&&!roadReady(S))return btn('bus','Board the team bus',true);
  if(S.contract&&contractDue(S))return btn('finish-month','Close the month',true);
  if(S.played>=6) {
    if(S.road&&S.road.index>=2)return '<p>All three away series are recorded. Rest at home through the remaining dates, then read your road-month recap.</p>';
    return S.contract?btn('new-series',S.road?'Take the bus to '+ROAD_TOWNS[S.road.index+1].name:'Begin another six-game series',true):'';
  }
  return (!S.prepared?'<h3>One preparation before the game</h3><div class="actions">'+btn('train-contact','Practice contact')+btn('train-power','Practice power')+btn('train-discipline','Study the pitcher')+btn('rest','Rest your legs')+'</div>':'<p>Your preparation is done. The field is ready.</p>')+btn('match','Play game '+(S.played+1)+' of 6',true);
}
function calendarHTML() {
  const cal=calendarStatus(S),period=currentPeriod(S),road=!!S.road;
  let html='<h2>The wall calendar</h2><p>Day '+S.day+(period?' · '+(road?'Road month':'First month')+', days '+period.start+'–'+(period.end-1):' · Your opening six games')+'. Dates move when you play or choose a quiet day.</p>';
  if(cal)html+='<h3>Salary dates</h3><p>'+esc(contractOffer(S.contract).role)+' · term ends day '+cal.end+'.</p><ul>'+cal.due.map(e=>'<li>Day '+e.day+' · '+money(e.amount)+' · '+(S.ledger.some(l=>l.id===e.id)?'Paid':'Due')+'</li>').join('')+'</ul><p>No upkeep and no pay tied to hits.</p>';
  if(road)html+='<h3>The away dates</h3>'+ROAD_TOWNS.map((t,i)=>'<p>Day '+(S.road.start+i*10)+' · '+t.name+' · '+t.park+' · six games'+(S.road.trips[t.id]?' · Bus choice recorded':'')+'</p>').join('');
  if(S.phase==='month') {
    html+='<h3>'+ (road?'The road you made':'A month with your name on it')+'</h3><p>'+period.games+' games · '+period.wins+' wins · '+period.record.hits+' hits · '+period.record.walks+' walks.</p><p>Average '+rate(average(period.record))+' · on-base '+rate(onBase(period.record))+'. Your record, home and money stay yours.</p>';
    if(!road){const o=ROAD_OFFERS[S.contract.offer];html+='<h3>The second month: three away series</h3><p>Keep your '+esc(o.role)+' role on a new thirty-day term. No signing bonus. Five '+money(o.wage)+' salaries, on days '+o.days.map(d=>S.day+d).join(', ')+'. Total '+money(o.wage*5)+'. Eighteen possible games at three parks; quiet days are your choice.</p>'+btn('start-road','Sign the road-month term and board the bus',true);}
    else html+='<p>This road chapter is complete. Your visits are remembered if a later season brings you back. There is no unattended calendar.</p>';
  } else if(['clubhouse','home'].includes(S.phase)) {
    html+='<h3>Day '+S.day+' · The next game</h3>'+preparationHTML();
    if(S.phase==='home')html+=btn('day','Spend a quiet day at home',false,!!period&&S.day>=period.end);
  }
  return html;
}
function careerSheetHTML(view,original) {
  const title='<div class="eyebrow">Day '+S.day+' · '+(S.road?'On the road':S.contract?esc(contractOffer(S.contract).name):esc(DC.club))+'</div><h1>'+esc(S.player?.name||'Rookie')+'</h1>';
  if(S.phase==='creator'||view==='report'||(view==='locker'&&S.phase==='offers'))return original;
  let body='';
  if(view==='coach')body='<h2>Iona\'s corner</h2><p class="quote">'+esc(S.message)+'</p>'+preparationHTML()+'<p class="muted">'+evaluation(S).text+'</p>'+(S.road?.standing?'<p>Remi makes room at the card table. The team knows you beyond your place in the batting order.</p>':'');
  else if(view==='calendar')body=calendarHTML();
  else if(view==='locker')body='<h2>Your locker</h2>'+(S.contract?'<p>Your contract is taped inside the door: '+esc(contractOffer(S.contract).name)+' · '+esc(S.contract.tier)+' · '+esc(contractOffer(S.contract).role)+'.</p><p>'+contractOffer(S.contract).moments+' playable key at-bats per game. Other turns use the same baseball model.</p>':'<p>A borrowed shirt and six games to make it your own. Iona keeps the call-up target in her notebook.</p>')+'<button data-sheet="calendar">Read the salary dates</button>';
  else if(view==='notebook')body='<h2>Iona\'s notebook</h2><div class="stats"><span>Contact '+S.stats.contact+'</span><span>Power '+S.stats.power+'</span><span>Eye '+S.stats.discipline+'</span><span>Fatigue '+S.fatigue+'</span></div>'+notebookHTML()+'<h3>Your recent games</h3>'+S.history.slice(-6).map(h=>'<p>Day '+h.day+' · '+esc(h.opponent)+' '+h.score[0]+'–'+h.score[1]+' · '+h.hero.hits+'/'+h.hero.ab+'</p>').join('')+'<p>Contact helps put the ball in play. Power favors extra bases. Eye helps reads; fatigue reduces contact. Rest clears it.</p>';
  else if(view==='ledger')body='<h2>The salary envelope</h2><p>Cash '+money(S.cash)+'. Every payment and purchase is recorded.</p><table class="ledger"><tbody>'+S.ledger.map(e=>'<tr><td>Day '+e.day+'<br>'+esc(e.label)+'</td><td>'+(e.amount<0?'−':'+')+money(Math.abs(e.amount))+'</td></tr>').join('')+'</tbody></table>';
  else if(view==='home')body='<h2>Your home and garage</h2><p>'+esc(S.message)+'</p><p>'+money(S.cash)+' in your own purse. These are permanent purchases, without upkeep.</p>'+Object.entries(DC.purchases).map(([id,p])=>'<article class="card offer"><h3>'+p.name+'</h3><p>'+(id==='car'?'Your own keys and a place in the garage.':'A sofa, a warm window and your shirt on the wall.')+'</p>'+btn('buy-'+id,S.owned[id]?'Yours, permanently':'Buy · '+money(p.price),false,!S.contract||S.owned[id]||S.cash<p.price)+'</article>').join('')+(S.phase==='home'?btn('day','Spend a quiet day at home'):'');
  else if(view==='rules')body='<h2>The field notes</h2><p>Four balls earn a walk. Three strikes make an out. A foul cannot be strike three. Three outs switch sides. Runs count at home. Nine innings, with extras for a tie.</p><p>You play key at-bats; all other turns use the same model. Contact favors reaching base; Power trades contact for extra bases. Timing: ready the pitch, then tap the field or press Space at the glowing circle. Tactical: choose your approach and pitch read, or let it go.</p><p>Settings switches styles without changing the current pitch. The first slice has no steals, errors or double plays; runners hold on clean outs.</p>';
  return title+body;
}
function openCareerSheet(view,button) {
  if(sceneState||pitchClock.running||!['coach','calendar','locker','notebook','ledger','home','rules','report'].includes(view))return false;
  careerSheet=view;lastSheetButton=button||document.activeElement;
  if(view==='home')careerRoom='home';else if(!['pitch','result','summary'].includes(S.phase))careerRoom='clubhouse';
  renderCareer();document.querySelector('#close-sheet').focus();return true;
}
function closeCareerSheet() {
  if(S.phase==='creator')return;
  careerSheet=null;renderCareer();if(lastSheetButton?.isConnected)lastSheetButton.focus();
}
function renderCareer() {
  renderCareerContent();
  const el=document.querySelector('#content'),panel=document.querySelector('#panel'),original=el.innerHTML;
  if(lastCareerPhase!==S.phase){
    if(S.phase==='creator')careerSheet='creator';else if(S.phase==='offers')careerSheet='locker';
    else if(S.phase==='summary')careerSheet='report';else if(S.phase==='month')careerSheet='calendar';
    else {careerSheet=null;careerRoom=S.phase==='home'?'home':'clubhouse';}
    lastCareerPhase=S.phase;
  }
  const playing=['pitch','result','summary'].includes(S.phase);
  const town=S.road?ROAD_TOWNS[S.road.index]:null;
  document.querySelector('#place').textContent=careerRoom==='bus'?'THE TEAM BUS':playing?(town?town.park+' · '+town.name:DC.park+' · Brackenport'):careerRoom==='home'?'YOUR HOME · BRACKENPORT':town?town.name+' · VISITORS\' CLUBHOUSE':'THE LANTERNS CLUBHOUSE';
  const objects=document.querySelector('#world-objects'),rooms=document.querySelector('#world-rooms');
  objects.hidden=playing||S.phase==='creator'||careerRoom==='bus';
  objects.innerHTML=careerRoom==='home'?worldObject('home','Your keys',28,56)+worldObject('ledger','Pay envelope',73,56)+worldObject('calendar','Calendar',48,29):
    worldObject('locker','Your locker',21,48)+worldObject('calendar','Wall calendar',57,29)+worldObject('notebook','Iona\'s notebook',70,56)+worldObject('coach','Talk to Iona',83,72);
  rooms.hidden=S.phase==='creator'||sceneState||careerRoom==='bus';
  rooms.innerHTML=(playing?'<button data-sheet="notebook">Notebook</button><button data-sheet="rules">Field notes</button>':'<button data-room="clubhouse">Clubhouse</button>'+(S.contract?'<button data-room="home">Home</button>':'')+'<button data-sheet="calendar">Calendar</button><button data-sheet="notebook">Notebook</button>');
  rooms.querySelectorAll('button').forEach(b=>b.disabled=pitchClock.running);
  el.innerHTML=careerSheetHTML(careerSheet||'coach',original);panel.hidden=!careerSheet;
  document.querySelector('#close-sheet').hidden=S.phase==='creator';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',careerSheet==='creator'?'Meet your player':'Career '+(careerSheet||'record'));
  panel.inert=!careerSheet||!!sceneState;
  if(S.road&&!S.active)document.querySelector('#scoreboard').innerHTML='<b>'+esc(contractOffer(S.contract).name)+'</b><div>Day '+(S.day-S.road.start+1)+' · Road month</div><div>'+S.road.games+' games · '+S.road.wins+' wins</div>';
}
document.querySelector('#close-sheet').addEventListener('click',closeCareerSheet);
document.querySelector('#stage').addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.sheet)openCareerSheet(button.dataset.sheet,button);
  else if(button.dataset.room&&!sceneState&&!pitchClock.running){careerRoom=button.dataset.room;careerSheet=null;renderCareer();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&careerSheet&&!sceneState&&!document.querySelector('#save-dialog').open&&!document.querySelector('.arc-set-bg:not([hidden])')){e.preventDefault();closeCareerSheet();}},true);
// Keep keyboard focus on the opened object, rather than the world underneath it.
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!careerSheet||sceneState||document.querySelector('#save-dialog').open||document.querySelector('.arc-set-bg:not([hidden])'))return;
  const panel=document.querySelector('#panel'),targets=[...panel.querySelectorAll('button:not([disabled]),input,select,summary,a[href]')].filter(el=>!el.hidden&&el.getClientRects().length);
  if(!targets.length)return;const first=targets[0],last=targets.at(-1);
  if(!panel.contains(document.activeElement)){e.preventDefault();(e.shiftKey?last:first).focus();}
  else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
},true);
