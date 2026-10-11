'use strict';
/* Diamond Manager: the screen. The field fills the window; the scoreboard, the play-by-play and Iona's notes sit on
   it; the front office is a clipboard opened over the field. */
const VERSION='0.2.0';
const $=s=>document.querySelector(s);
Arcade.validators[DM.key]=validLeague;
let L=migrateLeague(loadLeague(localStorage, Arcade.backups(DM.key))), view=null, tab='roster', trade={club:1,give:[],get:[],answer:''}, flash='';
const SPEEDS=[[1,'Normal speed',900],[2,'Fast',300],[3,'Very fast',90]];

function save(){ Arcade.save(DM.key,L); const y=L.clubs[DM.you];
  Arcade.report('baseball',{summary:'Lanterns '+y.w+'-'+y.l+' · season '+L.season,detail:'Cash '+money(L.cash)+' · '+(L.history.filter(h=>h.champion).length?L.history.filter(h=>h.champion).length+' titles':'chasing the first title')}); }
const you=()=>L.clubs[DM.you], club=i=>L.clubs[i], pl=(c,id)=>c.players.find(p=>p.id===id);
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* ---------- The scoreboard and the field ---------- */
function scoreboardHTML(){
  const y=you(), pos=standings(L).findIndex(s=>s.i===DM.you)+1;
  if(view){ const g=view.g, e=g.events[view.i]||g.events[0], n=Math.max(9,g.line[0].length);
    const shown=[[],[]]; let inn=0; // innings completed so far, for the line score
    for(let half=0;half<2;half++) for(let k=0;k<n;k++){ const done=e.inning>k+1||(e.inning===k+1&&e.half>half)||view.done; shown[half].push(done&&g.line[half][k]!==undefined?g.line[half][k]:(e.inning===k+1&&e.half===half&&!view.done?runsSoFar(g,view.i,k+1,half):'')); }
    const row=(t,half)=>'<tr><td>'+club(t).short+'</td>'+shown[half].map(v=>'<td>'+v+'</td>').join('')+'<td class="tot">'+e.score[half]+'</td></tr>';
    return '<table aria-label="Line score"><tr><th></th>'+Array.from({length:n},(_,k)=>'<th>'+(k+1)+'</th>').join('')+'<th>R</th></tr>'+row(g.away,0)+row(g.home,1)+'</table>'+
      '<div class="sb-line">'+(view.done?'<b>Final</b>':'<span>'+(e.half?'Bottom':'Top')+' '+e.inning+'</span><span>'+e.outs+' out'+(e.outs===1?'':'s')+'</span>')+'</div>'; }
  const next=L.phase==='season'?L.schedule[L.day].find(m=>m.includes(DM.you)):null;
  return '<b>Brackenport Lanterns</b> · '+y.w+' wins, '+y.l+' losses · '+nth(pos)+' of 6'+
    '<div class="sb-line">'+(L.phase==='season'?'Season '+L.season+', game '+(L.day+1)+' of '+DM.seasonGames+(next?': '+(next[0]===DM.you?'home to the '+club(next[1]).short:'away at the '+club(next[0]).short):''):L.phase==='final'?'The final: best of three':'The offseason')+'</div>';
}
function runsSoFar(g,i,inning,half){ let r=0; for(let k=0;k<=i;k++){const e=g.events[k]; if(e.inning===inning&&e.half===half&&e.runs)r+=e.runs;} return r; }

/* ---------- Actions on the field ---------- */
function actionsHTML(){
  const m='<div class="money">Cash <b>'+money(L.cash)+'</b> · Payroll '+money(payroll(you()))+' of '+money(you().budget)+'</div>';
  if(view&&!view.done) return '<button id="a-speed">'+SPEEDS[L.speed-1][1]+' (change)</button><button class="primary" id="a-skip">Skip to the final score</button>';
  if(view&&view.done) return m+'<button class="primary" id="a-after">Hear from Iona</button>';
  const office='<button id="a-office">Front office (F)</button>';
  if(L.phase==='season') return m+'<button class="primary" id="a-play">Play ball (Space)</button><button id="a-sim">Sim this game</button>'+office;
  if(L.phase==='final'){ const inIt=L.final.teams.includes(DM.you); return m+'<button class="primary" id="a-final">'+(inIt?'Play':'Watch')+' final game '+(L.final.games.length+1)+'</button>'+office; }
  const ok=canStartSeason(L);
  return m+office+'<button class="primary" id="a-season" '+(ok?'':'disabled')+'>Start season '+(L.season+1)+'</button>'+(ok?'':'<div class="money">'+startBlock()+'</div>');
}
function startBlock(){ const c=you(); const n=c.players.filter(p=>p.years<=0).length;
  if(n) return n+' contract'+(n>1?'s are':' is')+' ending. Open the front office, Roster, to re-sign or let go.';
  if(!rosterOk(c)) return 'You need nine batters and five pitchers (and at most '+DM.rosterMax+' players).';
  if(payroll(c)>c.budget) return 'The payroll is over the owner\'s budget.'; return ''; }

function render(){
  $('#scoreboard').innerHTML=scoreboardHTML();
  $('#actions').innerHTML=actionsHTML();
  if(!$('#office').hidden) renderOffice();
}
function feed(e){ const d=document.createElement('p'); d.textContent=e.t; if(e.head)d.className='head'; else if(e.runs)d.className='run'; $('#feed').appendChild(d); $('#feed').scrollTop=1e6; }

/* ---------- Watching a game ---------- */
function watch(g,instant){
  view={g,i:0,done:false,at:0}; $('#feed').replaceChildren(); feed(g.events[0]);
  if(instant) finishWatch(); render();
}
function stepWatch(now){
  if(view&&!view.done&&now-view.at>=SPEEDS[L.speed-1][2]){ view.at=now; view.i++;
    if(view.i>=view.g.events.length){ view.i=view.g.events.length-1; finishWatch(); }
    else { const e=view.g.events[view.i]; feed(e); if(typeof e.res==='number'&&fieldSize)throwBall(e.res,fieldSize.s); }
    render(); }
}
function finishWatch(){ if(!view)return; if(!view.done){ for(let k=view.i+1;k<view.g.events.length;k++)feed(view.g.events[k]); view.i=view.g.events.length-1; view.done=true; } }

/* ---------- Iona's notes ---------- */
function note(html,buttons){ $('#note').innerHTML=html+'<div class="row">'+buttons+'</div>'; $('#note').hidden=false; const b=$('#note .primary')||$('#note button'); if(b)b.focus(); }
function closeNote(){ $('#note').hidden=true; }
function afterGameNote(g){
  const mine=g.home===DM.you?1:g.away===DM.you?0:-1, won=mine>=0&&g.winner===DM.you, c=you();
  if(mine<0){ view=null; return showOffseasonOrNext(); }
  const lines=c.lineup.map(id=>({p:pl(c,id),s:g.box[id]})).filter(x=>x.s&&x.p);
  const star=lines.slice().sort((a,b)=>(b.s.h*2+b.s.hr*3+b.s.rbi)-(a.s.h*2+a.s.hr*3+a.s.rbi))[0];
  const starter=pl(c,g.starters[mine]), oppHits=g.hits[1-mine], ourHits=g.hits[mine];
  const why=[];
  if(star&&star.s.h) why.push(star.p.name+' went '+star.s.h+' for '+star.s.ab+(star.s.hr?' with '+(star.s.hr>1?star.s.hr+' home runs':'a home run'):'')+(star.s.rbi?' and drove in '+star.s.rbi:'')+'.');
  why.push('We had '+ourHits+' hit'+(ourHits===1?'':'s')+'; they had '+oppHits+'.');
  if(starter) why.push(starter.name+' started on the mound for us (Stuff '+starter.stuff+', Control '+starter.control+').');
  if(!won){ const weak=lines.slice().sort((a,b)=>overall(a.p)-overall(b.p))[0]; if(weak&&L.day<6) why.push('Our weakest bat is '+weak.p.name+' (overall '+overall(weak.p)+'). A trade or a free agent could help; the front office has both.'); }
  const gate=L.results.length&&L.results[L.results.length-1].gate&&L.phase!=='final';
  const r=L.results[L.results.length-1];
  note('<div class="who">Iona Vale, field manager</div><h2>'+(won?'A win':'A loss')+', '+Math.max(...g.score)+' to '+Math.min(...g.score)+'</h2><ul>'+why.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+
    (gate&&r.gate?'<p>'+r.gate.crowd.toLocaleString()+' came to Lamplight Field. The gate brought in '+money(r.gate.money)+'.</p>':''),
    '<button class="primary" id="n-ok">Thanks, Iona</button>');
  view=null;
}
function showOffseasonOrNext(){
  if(L.offer){ const o=L.offer, them=club(o.club), give=pl(you(),o.give), get=pl(them,o.get);
    if(!give||!get){ L.offer=null; return showOffseasonOrNext(); }
    return note('<div class="who">A call from the '+esc(them.name)+'</div><h2>A trade offer</h2><p>They offer <b>'+esc(get.name)+'</b> ('+desc(get)+') for your <b>'+esc(give.name)+'</b> ('+desc(give)+').</p><p class="who">Iona</p><p>'+esc(ionaOnTrade(give,get))+'</p>',
      '<button class="primary" id="n-yes">Accept the trade</button><button id="n-no">No, thank you</button>'); }
  if(L.phase==='offseason'&&L.report&&!L.report.seen){ const r=L.report, h=L.history[L.history.length-1]; L.report.seen=true; save();
    return note('<div class="who">The owner\'s office</div><h2>Season '+h.season+' is over</h2><p>The Lanterns finished '+h.w+'-'+h.l+', '+nth(h.place)+' of 6. '+esc(h.championName)+' '+(h.champion?'(that is us!)':'')+' won the final.</p>'+
      '<p>'+(r.raise?'The owner raises the payroll budget by '+money(r.raise)+'.':'The owner keeps the payroll budget where it is. A winning season earns a raise.')+'</p>'+
      (r.grew.length?'<p>Grew over the winter: '+r.grew.map(x=>esc(x.name)+' (+'+x.d+')').join(', ')+'.</p>':'')+(r.slipped.length?'<p>Slipped with age: '+r.slipped.map(x=>esc(x.name)+' ('+x.d+')').join(', ')+'.</p>':'')+
      (r.expiring.length?'<p><b>'+r.expiring.length+' contract'+(r.expiring.length>1?'s end':' ends')+'.</b> Re-sign or let go in the front office before the new season.</p>':'')+'<p>New free agents are waiting.</p>',
      '<button class="primary" id="n-office">Open the front office</button><button id="n-ok">Later</button>'); }
  closeNote(); render();
}
/* Iona's honest read of an offer: today's quality first, then age, so the general manager has a second opinion. */
function ionaOnTrade(give,get){ const d=overall(get)-overall(give), young=get.age<give.age-3, old=get.age>give.age+3;
  if(d>=3) return 'This helps us now: '+get.name+' is the better player today.'+(old?' The catch: '+get.name+' is older, so the edge may not last.':'');
  if(d<=-3) return 'This helps them. '+give.name+' is the better player'+(young?', though '+get.name+' is younger and may grow.':'. I would say no.');
  return 'About even today.'+(young?' '+get.name+' is younger, so it could tilt our way.':old?' '+get.name+' is older, so it could tilt their way.':' Take it if you want the change.'); }
function desc(p){ return (p.pitcher?'pitcher':p.pos)+', overall '+overall(p)+', age '+p.age+', '+money(p.salary)+' a season'; }
function introNote(){
  note('<div class="who">Iona Vale, field manager</div><h2>Welcome to Lamplight Field</h2><p>The owner hired you as general manager of the Brackenport Lanterns, the worst club in the league. I run the dugout; you build the team.</p>'+
    '<ul><li><b>Play ball</b> to watch our next game. Speed it up or skip to the final score whenever you like.</li><li><b>Front office</b> is where you set the batting order, trade with the other five clubs, sign free agents and spend the gate money on the ballpark.</li><li>The owner\'s budget is '+money(you().budget)+' and the payroll is '+money(payroll(you()))+', so there is room for '+money(you().budget-payroll(you()))+' of new players. The <b>Free agents</b> page is the quickest way to get better.</li><li>Every player has ratings from 0 to 99. Better ratings win more games. Thirty games make a season; the top two meet in a final.</li></ul>'+
    '<p class="small">Keys: Space plays the next game or continues, F opens the front office, Escape closes it.</p>',
    '<button class="primary" id="n-ok">Let\'s play ball</button>');
  L.intro=false; save();
}

/* ---------- The front office ---------- */
const TABS=[['roster','Roster and lineup'],['trades','Trades'],['free','Free agents'],['park','Ballpark'],['league','League']];
function openOffice(t){ if(t)tab=t; $('#office').hidden=false; closeNote(); renderOffice(); $('#close-office').focus(); }
function closeOffice(){ $('#office').hidden=true; flash=''; render(); }
function renderOffice(){
  $('#tabs').innerHTML=TABS.map(([k,n])=>'<button role="tab" data-tab="'+k+'" aria-selected="'+(k===tab)+'">'+n+'</button>').join('');
  const m=flash?'<div class="msg'+(flash.startsWith('✓')?' ok':'')+'" role="status">'+esc(flash)+'</div>':'';
  $('#office-body').innerHTML=m+({roster:rosterTab,trades:tradeTab,free:freeTab,park:parkTab,league:leagueTab}[tab])();
}
function ratingCells(p){ return p.pitcher?'<td>'+p.stuff+'</td><td>'+p.control+'</td><td>'+p.stamina+'</td>':'<td>'+p.contact+'</td><td>'+p.power+'</td><td>'+p.eye+'</td><td>'+p.glove+'</td>'; }
function seasonCell(p){ const s=p.season; if(!s||!s.g)return '<td class="small hide-sm">-</td>'; return p.pitcher?'<td class="small hide-sm">'+s.g+' games</td>':'<td class="small hide-sm">'+(s.ab?(s.h/s.ab).toFixed(3).replace(/^0/,''):'.000')+', '+s.hr+' HR, '+s.rbi+' RBI</td>'; }
function contractCell(p){ if(p.years>0) return '<td>'+money(p.salary)+' × '+p.years+' yr</td><td><button data-release="'+p.id+'">Let go</button></td>';
  return '<td><b>Ending</b></td><td><button class="primary" data-resign="'+p.id+'">Re-sign for '+money(askSalary(p,L.upgrades.clubhouse))+'</button> <button data-release="'+p.id+'">Let go</button></td>'; }
function rosterTab(){
  const c=you(), line=c.lineup.map(id=>pl(c,id)), bench=batters(c).filter(p=>!c.lineup.includes(p.id));
  return '<p>Payroll <b>'+money(payroll(c))+'</b> of the owner\'s budget of <b>'+money(c.budget)+'</b>. Roster '+c.players.length+' of '+DM.rosterMax+'. Ratings run from 0 to 99; overall is shown in bold.</p>'+
   '<h3>Batting order</h3><p class="small">The top of the order bats most. Contact makes hits, Power makes extra bases and home runs, Eye draws walks, Glove stops the other side\'s hits.</p><div class="scroll-x"><table class="tbl"><tr><th>#</th><th>Batter</th><th>Pos</th><th>Age</th><th>Overall</th><th>Contact</th><th>Power</th><th>Eye</th><th>Glove</th><th class="hide-sm">This season</th><th>Order</th><th>Contract</th><th></th></tr>'+
   line.map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(p.name)+'</td><td>'+p.pos+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td>'+ratingCells(p)+seasonCell(p)+'<td><button data-up="'+i+'" aria-label="Move '+esc(p.name)+' up" '+(i?'':'disabled')+'>▲</button><button data-down="'+i+'" aria-label="Move '+esc(p.name)+' down" '+(i<8?'':'disabled')+'>▼</button></td>'+contractCell(p)+'</tr>').join('')+
   bench.map(p=>'<tr><td>Bench</td><td>'+esc(p.name)+'</td><td>'+p.pos+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td>'+ratingCells(p)+seasonCell(p)+'<td><button data-start="'+p.id+'">Start for №9</button></td>'+contractCell(p)+'</tr>').join('')+'</table></div>'+
   '<p><button data-auto>Let Iona set the order</button></p>'+
   '<h3>Pitchers</h3><p class="small">The five best pitchers start in turn. Stuff gets strikeouts, Control avoids walks, Stamina keeps a starter in the game longer before the bullpen takes over.</p><div class="scroll-x"><table class="tbl"><tr><th>Pitcher</th><th>Age</th><th>Overall</th><th>Stuff</th><th>Control</th><th>Stamina</th><th>Contract</th><th></th></tr>'+
   pitchers(c).sort((a,b)=>overall(b)-overall(a)).map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td>'+ratingCells(p)+contractCell(p)+'</tr>').join('')+'</table></div>'+
   '<p class="small">Letting a player go in the middle of a contract costs half a season\'s salary from the club\'s cash.</p>';
}
function pickList(c,side,ids){ return c.players.slice().sort((a,b)=>(a.pitcher-b.pitcher)||overall(b)-overall(a)).map(p=>'<label class="pick"><input type="checkbox" data-pick="'+side+'" value="'+p.id+'" '+(ids.includes(p.id)?'checked':'')+'> '+esc(p.name)+' <span class="small">'+(p.pitcher?'P':p.pos)+', overall '+overall(p)+', age '+p.age+', '+money(p.salary)+'</span></label>').join(''); }
function tradeTab(){
  const them=club(trade.club);
  return '<p>Pick a club, tick the players you would give and the players you want, then ask. Their general manager says yes or tells you how far apart you are. Young, highly rated players on fair salaries are worth the most.</p>'+
   '<p><label>Trade with <select id="trade-club">'+L.clubs.map((c,i)=>i===DM.you?'':'<option value="'+i+'" '+(i===trade.club?'selected':'')+'>'+esc(c.name)+' ('+c.w+'-'+c.l+')</option>').join('')+'</select></label></p>'+
   '<div class="cols"><div><h3>You give</h3>'+pickList(you(),'give',trade.give)+'</div><div><h3>You get, from the '+esc(them.short)+'</h3>'+pickList(them,'get',trade.get)+'</div></div>'+
   (trade.answer?'<div class="msg" role="status">'+esc(trade.answer)+'</div>':'')+
   '<p><button id="trade-ask">Ask what they think</button> <button class="primary" id="trade-do">Propose the trade</button></p>';
}
function freeTab(){
  return '<p>Players without a club. They sign for the salary shown, as long as the payroll stays inside the owner\'s budget ('+money(payroll(you()))+' of '+money(you().budget)+'). Each winter two <b>standouts</b> arrive, the best players on the market; a better Scouting office makes them better still. <b>League minimum</b> players are always there and do not count against the budget, so you can always fill the roster.</p><div class="scroll-x"><table class="tbl"><tr><th>Player</th><th>Pos</th><th>Age</th><th>Overall</th><th>Ratings</th><th>Asks</th><th></th></tr>'+
   L.freeAgents.map(p=>'<tr><td>'+esc(p.name)+(p.star?' <b class="small">Standout</b>':p.bargain?' <span class="small">League minimum</span>':'')+'</td><td>'+(p.pitcher?'P':p.pos)+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td><td class="small">'+(p.pitcher?'Stuff '+p.stuff+', Control '+p.control+', Stamina '+p.stamina:'Contact '+p.contact+', Power '+p.power+', Eye '+p.eye+', Glove '+p.glove)+'</td><td>'+money(p.salary)+' × '+p.years+' yr</td><td><button class="primary" data-sign="'+p.id+'">Sign</button></td></tr>').join('')+'</table></div>';
}
function parkTab(){
  return '<p>The club\'s cash comes from the gate at home games: more wins and a better park bring bigger crowds. Upgrades show on the field.</p><p>Last home crowd: '+(()=>{const g=gateMoney(L);return g.crowd.toLocaleString()+' of '+g.cap.toLocaleString()+' seats ('+money(g.money)+' a game at '+'$'+DM.ticket+' a ticket)';})()+'. Cash: <b>'+money(L.cash)+'</b>.</p>'+
   '<div class="upg">'+Object.entries(DM.upgrades).map(([k,u])=>{const lv=L.upgrades[k],max=u.cost.length;return '<div><h3>'+u.name+'</h3><div class="dots" aria-label="Level '+lv+' of '+max+'">'+'●'.repeat(lv)+'○'.repeat(max-lv)+'</div><p class="small">'+u.what+'</p>'+(lv<max?'<button class="primary" data-up-park="'+k+'" '+(L.cash>=u.cost[lv]?'':'disabled')+'>Build for '+money(u.cost[lv])+'</button>':'<b>Finished</b>')+'</div>';}).join('')+'</div>';
}
function leagueTab(){
  const s=standings(L);
  return '<h3>Standings, season '+L.season+'</h3><table class="tbl"><tr><th></th><th>Club</th><th>Won</th><th>Lost</th><th>Runs for</th><th>Runs against</th><th>Average overall</th></tr>'+
   s.map((x,i)=>'<tr class="'+(x.i===DM.you?'you':'')+'"><td>'+(i+1)+'</td><td>'+esc(x.c.name)+'</td><td>'+x.c.w+'</td><td>'+x.c.l+'</td><td>'+x.c.rs+'</td><td>'+x.c.ra+'</td><td>'+Math.round(x.c.players.reduce((n,p)=>n+overall(p),0)/x.c.players.length)+'</td></tr>').join('')+'</table>'+
   (L.final?'<p>The final: '+esc(club(L.final.teams[0]).short)+' '+L.final.wins[0]+', '+esc(club(L.final.teams[1]).short)+' '+L.final.wins[1]+'.</p>':'<p class="small">After '+DM.seasonGames+' games the top two meet in a best-of-three final.</p>')+
   (L.history.length?'<h3>Past seasons</h3><ul>'+L.history.map(h=>'<li>Season '+h.season+': '+h.w+'-'+h.l+', '+nth(h.place)+(h.champion?', <b>champions</b>':'')+'</li>').join('')+'</ul>':'')+
   (L.log.length?'<h3>Trades</h3><ul>'+L.log.slice(-8).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'');
}

/* Confirmation stays inside the game, with the cost visible before choosing. */
function confirmRelease(p) {
  const dialog = $('#decision-dialog');
  $('#decision-text').textContent = 'Let ' + p.name + ' go? ' + (p.years > 0 ? 'The club pays ' + money(Math.round(p.salary / 2)) + ' to end the contract.' : 'The contract is ending, so there is no release fee.');
  return new Promise(resolve => {
    const finish = yes => { dialog.close(); dialog.removeEventListener('cancel', cancel); $('#decision-yes').onclick = null; $('#decision-no').onclick = null; resolve(yes); };
    const cancel = e => { e.preventDefault(); finish(false); };
    $('#decision-yes').onclick = () => finish(true);
    $('#decision-no').onclick = () => finish(false);
    dialog.addEventListener('cancel', cancel);
    dialog.showModal(); $('#decision-no').focus();
  });
}

/* ---------- Input ---------- */
function act(id){
  if(id==='a-play'||id==='a-sim'){ const g=playDay(L); save(); watch(g,id==='a-sim'); }
  else if(id==='a-final'){ const g=playFinalGame(L); save(); watch(g,!L.final.teams.includes(DM.you)); }
  else if(id==='a-skip'){ finishWatch(); render(); }
  else if(id==='a-speed'){ L.speed=L.speed%3+1; save(); render(); }
  else if(id==='a-after'){ afterGameNote(view.g); render(); }
  else if(id==='a-office'||id==='n-office'){ openOffice(id==='n-office'?'roster':null); }
  else if(id==='a-season'){ if(startSeason(L)){ save(); $('#feed').replaceChildren(); render(); } }
  else if(id==='n-ok'){ showOffseasonOrNext(); }
  else if(id==='n-yes'||id==='n-no'){ const r=answerOffer(L,id==='n-yes'); save(); if(r) return note('<div class="who">Iona Vale</div><p>'+esc(r)+'</p>', '<button class="primary" id="n-ok">Back to the field</button>'); showOffseasonOrNext(); }
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button'); if(!b||b.disabled) return;
  if(b.id&&(b.id.startsWith('a-')||b.id.startsWith('n-'))) return act(b.id);
  if(b.id==='close-office') return closeOffice();
  if(b.dataset.tab){ tab=b.dataset.tab; flash=''; return renderOffice(); }
  const c=you(); let r=null;
  if(b.dataset.up!==undefined||b.dataset.down!==undefined){ const i=Number(b.dataset.up??b.dataset.down), j=b.dataset.up!==undefined?i-1:i+1; const l=c.lineup.slice(); [l[i],l[j]]=[l[j],l[i]]; c.lineup=l; r=''; }
  else if(b.dataset.start){ const l=c.lineup.slice(); l[8]=Number(b.dataset.start); c.lineup=l; setLineup(c,l); r=''; }
  else if(b.dataset.auto!==undefined){ autoLineup(c); r='✓ Iona set the order: best on-base hitters first, power in the middle.'; }
  else if(b.dataset.resign){ const p=pl(c,Number(b.dataset.resign)); r=resign(L,Number(b.dataset.resign))||'✓ '+p.name+' signed again.'; }
  else if(b.dataset.release){ const p=pl(c,Number(b.dataset.release)); if(!await confirmRelease(p))return; r=release(L,Number(b.dataset.release))||'✓ '+p.name+' has left the club.'; }
  else if(b.dataset.sign){ const p=L.freeAgents.find(x=>x.id===Number(b.dataset.sign)); r=signFree(L,Number(b.dataset.sign))||'✓ '+p.name+' joins the Lanterns.'; }
  else if(b.dataset.upPark){ r=buyUpgrade(L,b.dataset.upPark)||'✓ The '+DM.upgrades[b.dataset.upPark].name.toLowerCase()+' are built.'; }
  else if(b.id==='trade-ask'){ trade.answer=judgeTrade(L,trade.club,trade.give,trade.get).why; r=''; }
  else if(b.id==='trade-do'){ const x=doTrade(L,trade.club,trade.give,trade.get); trade.answer=x||'Done. The new players are on your roster.'; if(!x){trade.give=[];trade.get=[];} r=''; }
  if(r!==null){ if(r)flash=r; save(); render(); }
});
document.addEventListener('change',e=>{
  if(e.target.id==='trade-club'){ trade={club:Number(e.target.value),give:trade.give,get:[],answer:''}; renderOffice(); }
  else if(e.target.dataset.pick){ const k=e.target.dataset.pick, id=Number(e.target.value); trade[k]=e.target.checked?trade[k].concat(id):trade[k].filter(x=>x!==id); trade.answer=''; }
});
document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]')||document.querySelector('.arc-set-bg:not([hidden])'))return;
  if(e.key==='Escape'){ if(!$('#office').hidden)closeOffice(); return; }
  if(e.target.closest('input,select,textarea,button,a')||!$('#office').hidden) return;
  if(e.key==='f'||e.key==='F'){ if(!view||view.done)openOffice(); return; }
  if(e.code!=='Space'&&e.key!=='Enter') return; e.preventDefault();
  if(!$('#note').hidden){ const b=$('#note .primary'); if(b)b.click(); return; }
  const b=$('#actions .primary'); if(b&&!b.disabled)b.click();
});
$('#help').addEventListener('click',introNote);
$('#save-tools').addEventListener('click',()=>{ $('#save-content').innerHTML=Arcade.saveToolsHTML(DM.key); $('#save-dialog').showModal(); });
$('#close-save').addEventListener('click',()=>$('#save-dialog').close());
Settings.create({mount:'#tools',rows:[]});
if(window.setupFeedback) setupFeedback('Diamond Manager',VERSION,()=>'Season '+L.season+', day '+L.day+', '+L.phase);
addEventListener('pagehide',save);

let fieldSize=null;
function frame(now){ stepWatch(now); const e=view?view.g.events[view.i]:null; fieldSize=drawField($('#field'),L,e); requestAnimationFrame(frame); }
render(); requestAnimationFrame(frame);
if(L.intro) introNote(); else showOffseasonOrNext();
if(location.hostname==='localhost') window.__dm={get L(){return L;},set L(v){L=v;render();},DM,newLeague,playGame,playDay,playFinalGame,recordGame,standings,overall,askSalary,payroll,batters,pitchers,setLineup,autoLineup,makeSchedule,plateAppearance,gateMoney,endSeason,canStartSeason,startSeason,resign,release,signFree,buyUpgrade,worth,judgeTrade,doTrade,aiOffer,answerOffer,validLeague,loadLeague,migrateLeague,rosterOk,render};
