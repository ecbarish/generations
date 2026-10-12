'use strict';
/* Diamond Manager: the screen. The field fills the window; the scoreboard, the play-by-play and Iona's notes sit on
   it; the front office is a clipboard opened over the field. */
const VERSION='0.5.1';
const $=s=>document.querySelector(s);
Arcade.validators[DM.key]=validLeague;
let L=migrateLeague(loadLeague(localStorage, Arcade.backups(DM.key))), view=null, tab='roster', trade={club:1,give:[],get:[],answer:''}, finder={pos:'any',shop:0,want:null,deal:null,offers:null}, flash='';
const SPEEDS=[[1,'Normal speed',900],[2,'Fast',300],[3,'Very fast',90]];

function save(){ Arcade.save(DM.key,L); const y=L.clubs[DM.you];
  Arcade.report('baseball',{summary:'Lanterns '+y.w+'-'+y.l+' · season '+L.season,detail:'Cash '+money(L.cash)+' · '+(L.history.filter(h=>h.champion).length?L.history.filter(h=>h.champion).length+' titles':'chasing the first title')}); }
const you=()=>L.clubs[DM.you], club=i=>L.clubs[i], pl=(c,id)=>c.players.find(p=>p.id===id);
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* ---------- The scoreboard and the field ---------- */
const SPEED_X=[1,.4,.12];
const dots=(n,max,cls)=>Array.from({length:max},(_,i)=>'<i class="dot'+(i<n?' on '+cls:'')+'" aria-hidden="true"></i>').join('');
function scoreboardHTML(){
  const y=you(), pos=standings(L).findIndex(s=>s.i===DM.you)+1;
  if(view){ const g=view.g, e=view.e||{inning:1,half:0,outs:0,balls:0,strikes:0,score:[0,0]}, n=Math.max(9,g.line[0].length,g.line[1].length);
    const row=(t,half)=>'<tr><td>'+club(t).short+'</td>'+Array.from({length:n},(_,k)=>'<td>'+(g.line[half][k]!==undefined?g.line[half][k]:'')+'</td>').join('')+'<td class="tot">'+e.score[half]+'</td><td>'+(view.done?g.hits[half]:hitsSoFar(g,half))+'</td></tr>';
    return '<table aria-label="Line score"><tr><th></th>'+Array.from({length:n},(_,k)=>'<th>'+(k+1)+'</th>').join('')+'<th>R</th><th>H</th></tr>'+row(g.away,0)+row(g.home,1)+'</table>'+
      '<div class="sb-line">'+(view.done?'<b>Final</b>':'<span>'+(e.half?'▼ Bottom':'▲ Top')+' '+e.inning+'</span><span aria-label="'+e.balls+' balls">B '+dots(Math.min(3,e.balls),3,'b')+'</span><span aria-label="'+e.strikes+' strikes">S '+dots(Math.min(2,e.strikes),2,'s')+'</span><span aria-label="'+e.outs+' outs">O '+dots(Math.min(2,e.outs),2,'o')+'</span>')+'</div>'; }
  const next=L.phase==='season'?L.schedule[L.day].find(m=>m.includes(DM.you)):null;
  return '<b>Brackenport Lanterns</b> · '+y.w+' wins, '+y.l+' losses · '+nth(pos)+' of 6'+
    '<div class="sb-line">'+(L.phase==='season'?'Season '+L.season+', game '+(L.day+1)+' of '+DM.seasonGames+(next?': '+(next[0]===DM.you?'home to the '+club(next[1]).short:'away at the '+club(next[0]).short):''):L.phase==='final'?'The final: best of three':'The offseason')+'</div>';
}
function hitsSoFar(g,half){ return g.hits[half]; }

/* ---------- Actions on the field ---------- */
function actionsHTML(){
  const m='<div class="money">Cash <b>'+money(L.cash)+'</b> · Payroll '+money(payroll(you()))+' of '+money(you().budget)+'</div>';
  if(view&&!view.done){ const ours=view.g.manage>=0;
    return '<button id="a-speed">'+SPEEDS[L.speed-1][1]+' (change)</button>'+(ours?'<button id="a-moves" '+(view.g.hold?'disabled':'')+'>'+(view.g.hold?'Waiting for the next batter…':'Make a move (M)')+'</button>':'')+'<button id="a-box">Box score (B)</button><button class="primary" id="a-skip">'+(ours?'Let Iona finish the game':'Skip to the final score')+'</button>'; }
  if(view&&view.done) return m+'<button class="primary" id="a-after">Hear from Iona</button><button id="a-box">Box score (B)</button>';
  const office='<button id="a-office">Front office (F)</button>';
  if(L.phase==='season') return m+'<button class="primary" id="a-play">Play ball (Space)</button><button id="a-sim">Sim this game</button>'+office;
  if(L.phase==='final'){ const inIt=L.final.teams.includes(DM.you); return m+'<button class="primary" id="a-final">'+(inIt?'Play':'Watch')+' final game '+(L.final.games.length+1)+'</button>'+office; }
  const ok=canStartSeason(L);
  return m+office+'<button class="primary" id="a-season" '+(ok?'':'disabled')+'>Start season '+(L.season+1)+'</button>'+(ok?'':'<div class="money">'+startBlock()+'</div>');
}
function startBlock(){ const c=you(); const n=c.players.filter(p=>p.years<=0).length;
  if(L.draft&&!L.draft.done) return 'The draft is waiting for our pick. Open the front office, Farm and draft.';
  if(n) return n+' contract'+(n>1?'s are':' is')+' ending. Open the front office, Roster, to re-sign or let go.';
  if(!rosterOk(c)) return 'You need nine batters and five pitchers (and at most '+DM.rosterMax+' players).';
  if(payroll(c)>c.budget) return 'The payroll is over the owner\'s budget.'; return ''; }

let lastActions='';
function render(){
  $('#scoreboard').innerHTML=scoreboardHTML();
  const a=actionsHTML(); if(a!==lastActions){ $('#actions').innerHTML=a; lastActions=a; } // unchanged buttons stay put, so clicks land
  if(!$('#office').hidden) renderOffice();
}
function feed(e){ const d=document.createElement('p'); d.textContent=e.t; if(e.kind==='head')d.className='head'; else if(e.runs)d.className='run'; else if(e.kind==='move')d.className='move'; $('#feed').appendChild(d); $('#feed').scrollTop=1e6; }

/* ---------- Watching (and managing) a game ---------- */
function watch(g,instant){
  view={g,n:0,e:null,at:0,prev:[0,0,0],scene:null,done:false,paused:false}; $('#feed').replaceChildren();
  if(instant) finishGame(L,g);
  pump(performance.now()); if(g.done){ view.done=true; save(); }
  if(g.ask) askNote(); render();
}
/* Show every event the engine has produced since last time. */
function pump(now){ const g=view.g;
  while(view.n<g.events.length){ const e=g.events[view.n++]; if(e.t) feed(e);
    const prev=view.e?view.e.runners:[0,0,0]; view.e=e;
    const defIdx=e.half?g.away:g.home, batIdx=e.half?g.home:g.away, pid=e.pitcher, bid=e.batter;
    const pp=club(defIdx).players.find(p=>p.id===pid), bp=club(batIdx).players.find(p=>p.id===bid);
    view.scene={e,prev,at:now,def:DM.clubs[defIdx].color,bat:DM.clubs[batIdx].color,
      pitcher:pp?lastName(pp)+' · '+(g.pbox[pid]?g.pbox[pid].pitches:0)+' pitches':'', batter:bp&&e.kind!=='play'?lastName(bp)+' · '+todayLine(g,bp):''}; } }
function todayLine(g,p){ const b=g.box[p.id]; if(b&&b.ab+b.bb) return b.h+' for '+b.ab+(b.bb?', '+b.bb+' walk'+(b.bb>1?'s':''):'')+' today'; const s=p.season; return s&&s.ab?'batting '+avg(s.h,s.ab)+' this season':'first time up'; }
const avg=(h,ab)=>ab?(h/ab).toFixed(3).replace(/^0/,''):'.000';
function waitFor(e){ if(!e) return 0; const base=e.kind==='head'?1300:e.kind==='up'?450:e.kind==='pitch'?700:e.kind==='move'?1600:e.kind==='play'?(e.bb?(e.bb.bb==='hr'?2600:2100):1300):0; return base*SPEED_X[L.speed-1]; }
function stepWatch(now){
  if(!view||view.done||view.paused||!$('#note').hidden) return;
  if(now-view.at<waitFor(view.e)) return;
  const g=view.g, r=stepGame(L,g); view.at=now; pump(now);
  if(r==='ask'){ save(); askNote(); }
  else if(r==='hold'){ save(); movesNote(''); }
  else if(g.done){ view.done=true; save(); }
  else if(view.e&&(view.e.kind==='play'||view.e.kind==='move')) save();
  render();
}
/* Iona stops the game for a big moment and asks. */
function askNote(){ const g=view.g, a=g.ask; if(!a) return; const side=a.side, c=gClub(L,g,side), who=id=>c.players.find(p=>p.id===id);
  const p=who(g.pitcher[side]), inn=who(a.id), lead=g.score[side]-g.score[1-side]; let q, yes;
  if(a.kind==='tired'){ q=p.name+' has thrown '+g.pbox[p.id].pitches+' pitches and is tiring. Bring in '+inn.name+' ('+pdesc(inn)+')?'; yes='Bring in '+lastName(inn); }
  else if(a.kind==='shelled'){ q=p.name+' has given up '+g.pbox[p.id].r+' runs today. Time for '+inn.name+' ('+pdesc(inn)+')?'; yes='Bring in '+lastName(inn); }
  else if(a.kind==='close'){ q='We lead by '+lead+' in the '+nth(g.inning)+'. Bring in '+inn.name+' ('+pdesc(inn)+') to close it out, or stay with '+lastName(p)+'?'; yes='Bring in '+lastName(inn); }
  else if(a.kind==='def'){ const out=who(a.out); q='We lead by '+lead+' late. '+inn.name+' (Glove '+inn.glove+') could take over in the field for '+out.name+' (Glove '+out.glove+') to protect the lead. '+lastName(out)+' would leave the game.'; yes=lastName(inn)+' goes in'; }
  else if(a.kind==='ph'){ const up=who(a.out); q=up.name+' is up (Contact '+up.contact+', Power '+up.power+'). '+inn.name+' could pinch hit (Contact '+inn.contact+', Power '+inn.power+'). '+lastName(up)+' would leave the game.'; yes=lastName(inn)+' bats'; }
  else { const r=who(a.out); q=r.name+' is on '+['first','second','third'][a.base]+' (Speed '+spd(r)+'). '+inn.name+' (Speed '+spd(inn)+') could run for '+lastName(r)+', who would leave the game.'; yes=lastName(inn)+' runs'; }
  view.paused=true;
  note('<div class="who">Iona, in the dugout</div><h2>Your call</h2><p>'+esc(q)+'</p>','<button class="primary" id="g-yes">'+esc(yes)+'</button><button id="g-no">No, play on</button><button id="g-moves">Something else</button>'); }
const pdesc=p=>'Stuff '+p.stuff+', Control '+p.control+', Stamina '+p.stamina;
/* Between batters, the player's moves: pitching changes, pinch hitters, pinch runners. */
function movesNote(msg){ const g=view.g, side=g.manage, c=gClub(L,g,side); if(side<0) return; view.paused=true;
  const p=c.players.find(x=>x.id===g.pitcher[side]), pb=g.pbox[p.id], tired=effective(g,side,p).tired, batting=g.half===side;
  let h='<div class="who">Iona, in the dugout</div><h2>Make a move</h2>'+(msg?'<div class="msg'+(msg.startsWith('✓')?' ok':'')+'" role="status">'+esc(msg)+'</div>':'');
  h+='<h3>On the mound</h3><p>'+esc(p.name)+': '+pb.pitches+' pitches, '+pb.r+' runs allowed'+(tired?', <b>tiring</b>':'')+'.</p>';
  const pen=bullpenOf(L,g,side);
  h+=batting?'<p class="small">Pitching changes happen when we are in the field.</p>':(pen.length?'<table class="mini">'+pen.map(x=>'<tr><td>'+esc(x.name)+'<br><span class="small">'+pdesc(x)+'</span></td><td><button data-mv-p="'+x.id+'">Bring in</button></td></tr>').join('')+'</table>':'<p class="small">Nobody is left in the bullpen.</p>');
  const bench=benchOf(L,g,side);
  if(batting){ const up=c.players.find(x=>x.id===g.lineup[side][g.order[side]]);
    h+='<h3>Pinch hit for '+esc(up.name)+'</h3>'+(bench.length?'<table class="mini">'+bench.map(x=>'<tr><td>'+esc(x.name)+'<br><span class="small">Contact '+x.contact+', Power '+x.power+', Eye '+x.eye+' (up now: '+up.contact+', '+up.power+', '+up.eye+')</span></td><td><button data-mv-ph="'+x.id+'">Bat for '+esc(lastName(up))+'</button></td></tr>').join('')+'</table>':'<p class="small">Nobody is left on the bench.</p>');
    const on=g.bases.map((id,i)=>[id,i]).filter(([id])=>id);
    if(on.length&&bench.length) h+='<h3>Pinch run</h3><table class="mini">'+on.map(([id,i])=>{const r=c.players.find(x=>x.id===id); return bench.map(x=>'<tr><td>'+esc(x.name)+' (Speed '+spd(x)+') for '+esc(r.name)+' on '+['first','second','third'][i]+' (Speed '+spd(r)+')</td><td><button data-mv-pr="'+i+':'+x.id+'">Run</button></td></tr>').join('');}).join('')+'</table>'; }
  else { const field=g.lineup[side].map(id=>c.players.find(x=>x.id===id)).sort((a,b)=>a.glove-b.glove).slice(0,3);
    h+='<h3>Defensive change</h3>'+(bench.length?'<table class="mini">'+bench.map(x=>'<tr><td>'+esc(x.name)+' (Glove '+x.glove+')</td><td>'+field.map(f=>'<button data-mv-d="'+f.id+':'+x.id+'">For '+esc(lastName(f))+' ('+f.glove+')</button>').join(' ')+'</td></tr>').join('')+'</table>':'<p class="small">Nobody is left on the bench.</p>')+'<p class="small">Pinch hitters, pinch runners and steals happen when we bat.</p>'; }
  if(batting){ const can=[0,1].filter(i=>g.bases[i]&&!g.bases[i+1]); if(can.length) h+='<h3>Steal</h3><table class="mini">'+can.map(i=>{const r=c.players.find(x=>x.id===g.bases[i]); return '<tr><td>'+esc(r.name)+' (Speed '+spd(r)+') goes for '+['second','third'][i]+' on the next pitch'+(g.steal&&g.steal.base===i?' <b>(on)</b>':'')+'</td><td><button data-mv-s="'+i+'">Send '+esc(lastName(r))+'</button></td></tr>';}).join('')+'</table>'; }
  h+='<p class="small">A player who leaves the game cannot come back in.</p>';
  note(h,'<button class="primary" id="g-resume">Play on</button>'); $('#note').classList.add('wide'); }
function boxNote(){ view&&(view.paused=true); note(boxHTML(view?boxScore(L,view.g):L.lastBox),'<button class="primary" id="g-resume">'+(view&&!view.done?'Back to the game':'Back to the field')+'</button>'); $('#note').classList.add('wide'); }
function ip(outs){ return Math.floor(outs/3)+(outs%3?'.'+outs%3:''); }
function boxHTML(b){ if(!b) return '<p>No game played yet.</p>'; const n=Math.max(9,b.line[0].length,b.line[1].length), name=i=>esc(club(i).short), teams=[b.away,b.home];
  let h='<h2>'+name(b.away)+' '+b.score[0]+', '+name(b.home)+' '+b.score[1]+'</h2><div class="scroll-x"><table class="tbl box"><tr><th></th>'+Array.from({length:n},(_,k)=>'<th>'+(k+1)+'</th>').join('')+'<th>R</th><th>H</th></tr>'+
    [0,1].map(s=>'<tr><td><b>'+name(teams[s])+'</b></td>'+Array.from({length:n},(_,k)=>'<td>'+(b.line[s][k]!==undefined?b.line[s][k]:'')+'</td>').join('')+'<td><b>'+b.score[s]+'</b></td><td>'+b.hits[s]+'</td></tr>').join('')+'</table></div>';
  for(const s of [0,1]){ const t=b.bat[s].reduce((a,x)=>{for(const k of ['ab','r','h','rbi','bb','k','hr','sb'])a[k]+=x[k]||0;return a;},{ab:0,r:0,h:0,rbi:0,bb:0,k:0,hr:0,sb:0});
    h+='<h3>'+esc(club(teams[s]).name)+'</h3><div class="scroll-x"><table class="tbl box"><tr><th>Batting</th><th>AB</th><th>R</th><th>H</th><th>RBI</th><th>BB</th><th>K</th><th>HR</th><th>SB</th></tr>'+
      b.bat[s].map(x=>'<tr><td>'+(x.sub?'&nbsp;&nbsp;':'')+esc(x.name)+' <span class="small">'+x.pos+'</span></td><td>'+x.ab+'</td><td>'+x.r+'</td><td>'+x.h+'</td><td>'+x.rbi+'</td><td>'+x.bb+'</td><td>'+x.k+'</td><td>'+x.hr+'</td><td>'+(x.sb||0)+'</td></tr>').join('')+
      '<tr><td><b>Totals</b></td><td>'+t.ab+'</td><td>'+t.r+'</td><td>'+t.h+'</td><td>'+t.rbi+'</td><td>'+t.bb+'</td><td>'+t.k+'</td><td>'+t.hr+'</td><td>'+t.sb+'</td></tr></table>'+
      '<table class="tbl box"><tr><th>Pitching</th><th>IP</th><th>H</th><th>R</th><th>BB</th><th>K</th><th>HR</th><th>Pitches</th></tr>'+
      b.pit[s].map(x=>'<tr><td>'+esc(x.name)+(x.dec?' <b>('+x.dec+')</b>':'')+'</td><td>'+ip(x.outs)+'</td><td>'+x.h+'</td><td>'+x.r+'</td><td>'+x.bb+'</td><td>'+x.k+'</td><td>'+x.hr+'</td><td>'+x.pitches+'</td></tr>').join('')+'</table></div>'; }
  return h+'<p class="small">AB at bats, R runs, H hits, RBI runs batted in, BB walks, K strikeouts, HR home runs, SB stolen bases, IP innings pitched. (W) and (L) mark the winning and losing pitchers.</p>'; }

/* ---------- Iona's notes ---------- */
function note(html,buttons){ $('#note').classList.remove('wide'); $('#note').innerHTML=html+'<div class="row">'+buttons+'</div>'; $('#note').hidden=false; const b=$('#note .primary')||$('#note button'); if(b)b.focus({preventScroll:true}); $('#note').scrollTop=0; }
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
  if(starter){ const sb=g.pbox[starter.id]; why.push(starter.name+' started for us: '+ip(sb.outs)+' innings, '+sb.r+' run'+(sb.r===1?'':'s')+', '+sb.k+' strikeout'+(sb.k===1?'':'s')+', '+sb.pitches+' pitches.'); }
  if(g.decision){ const w=pl(c,g.decision.w), l=pl(c,g.decision.l); if(w) why.push(w.name+' gets the win.'); else if(l) why.push(l.name+' takes the loss.'); }
  if(!won){ const weak=lines.slice().sort((a,b)=>overall(a.p)-overall(b.p))[0]; if(weak&&L.day<6) why.push('Our weakest bat is '+weak.p.name+' (overall '+overall(weak.p)+'). A trade or a free agent could help; the front office has both.'); }
  const gate=L.results.length&&L.results[L.results.length-1].gate&&L.phase!=='final';
  const r=L.results[L.results.length-1];
  note('<div class="who">Iona Vale, field manager</div><h2>'+(won?'A win':'A loss')+', '+Math.max(...g.score)+' to '+Math.min(...g.score)+'</h2><ul>'+why.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+
    ((L.moraleNotes||[]).filter(x=>x.key===(g.key??dayKey(L))).map(x=>'<p>'+esc(x.text)+'</p><button data-player-story="'+x.id+'">Talk with Iona about '+esc(pl(c,x.id)?.name||'the player')+'</button>').join(''))+(gate&&r.gate?'<p>'+r.gate.crowd.toLocaleString()+' came to Lamplight Field. The gate brought in '+money(r.gate.money)+'.</p>':''),
    '<button class="primary" id="n-ok">Thanks, Iona</button><button id="a-box">Box score</button>');
}
function showOffseasonOrNext(){
  if(L.offer){ const o=L.offer, them=club(o.club), give=pl(you(),o.give), get=pl(them,o.get);
    if(!give||!get){ L.offer=null; return showOffseasonOrNext(); }
    return note('<div class="who">A call from the '+esc(them.name)+'</div><h2>A trade offer</h2><p>They offer <b>'+esc(get.name)+'</b> ('+desc(get)+') for your <b>'+esc(give.name)+'</b> ('+desc(give)+').</p><p class="who">Iona</p><p>'+esc(ionaOnTrade(give,get))+'</p>',
      '<button class="primary" id="n-yes">Accept the trade</button><button id="n-no">No, thank you</button>'); }
  if(L.phase==='offseason'&&L.report&&!L.report.seen){ const r=L.report, h=L.history[L.history.length-1]; L.report.seen=true; save();
    return note('<div class="who">The owner\'s office</div><h2>Season '+h.season+' is over</h2><p>The Lanterns finished '+h.w+'-'+h.l+', '+nth(h.place)+' of 6. '+esc(h.championName)+' '+(h.champion?'(that is us!)':'')+' won the final.</p>'+
      '<p>'+(r.raise?'The owner raises the payroll budget by '+money(r.raise)+'.':'The owner keeps the payroll budget where it is. A winning season earns a raise.')+'</p>'+
      (h.completeStats?'<p><b>The league awards:</b> '+awardWords(h.awards.hitter,false)+'; '+awardWords(h.awards.pitcher,true)+'. The ledger and Trophy Case are in the front office.</p>':'')+
      (r.grew.length?'<p>Grew over the winter: '+r.grew.map(x=>esc(x.name)+(x.farm?' on the farm':'')+' (+'+x.d+')').join(', ')+'.</p>':'')+(r.left.length?'<p>Too old for the farm club now, so they left: '+r.left.map(esc).join(', ')+'.</p>':'')+(r.slipped.length?'<p>Slipped with age: '+r.slipped.map(x=>esc(x.name)+' ('+x.d+')').join(', ')+'.</p>':'')+
      (r.expiring.length?'<p><b>'+r.expiring.length+' contract'+(r.expiring.length>1?'s end':' ends')+'.</b> Re-sign or let go in the front office before the new season.</p>':'')+(r.coaching?.length?'<h3>What our coaches added</h3>'+coachingReport(r):'')+'<p>New free agents are waiting.'+(L.draft&&!L.draft.done?' <b>The draft is on, and we pick '+nth(L.draft.pick+1)+'.</b>':'')+'</p>',
      '<button class="primary" id="n-office">Open the front office</button><button id="n-history">Open the season ledger</button><button id="n-ok">Later</button>'); }
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
const TABS=[['roster','Roster and lineup'],['trades','Trades'],['free','Free agents'],['farm','Farm and draft'],['stats','Stats'],['people','Clubhouse'],['coaches','Coaches'],['park','Ballpark'],['league','League']];
function openOffice(t){ if(t)tab=t; $('#office').hidden=false; closeNote(); renderOffice(); $('#close-office').focus(); }
function closeOffice(){ $('#office').hidden=true; flash=''; finder.want=null; finder.deal=null; finder.offers=null; render(); }
function renderOffice(){
  $('#tabs').innerHTML=TABS.map(([k,n])=>'<button role="tab" data-tab="'+k+'" aria-selected="'+(k===tab)+'">'+n+'</button>').join('');
  const m=flash?'<div class="msg'+(flash.startsWith('✓')?' ok':'')+'" role="status">'+esc(flash)+'</div>':'';
  $('#office-body').innerHTML=m+({people:moraleTab,coaches:coachesTab,roster:rosterTab,trades:tradeTab,free:freeTab,farm:farmTab,stats:statsTab,park:parkTab,league:leagueTab}[tab])();
}
function moraleTab(){return trophyCaseHTML()+ '<p>Playing time, results and contract expectations shape how each player feels. Unsettled players ask 10% more; Settled players ask 5% less. The asking price is rounded to the nearest $10K. Give someone real innings to rebuild their place here.</p><div class="coach-grid">'+you().players.map(p=>'<article class="coach-card"><h4>'+esc(p.name)+'</h4><p>'+esc(p.pitcher?'Pitcher':p.pos)+' · '+moodWord(p)+'</p><p>'+esc(playerStory(p))+'</p><button data-player-story="'+p.id+'">Hear from Iona</button></article>').join('')+'</div>';}
function playerStoryNote(id,error=''){const p=pl(you(),id);if(!p)return;const m=playerMorale(p);note('<div class="who">Iona Vale, field manager</div><h2>'+esc(p.name)+'</h2><p>'+esc(playerStory(p))+'</p>'+(error?'<p role="status">'+esc(error)+'</p>':''),(m.request?.kind==='contract'?'<button class="primary" data-player-deal="'+id+'">Offer a new deal: '+money(askSalary(p,L.upgrades.clubhouse))+' a season</button>':m.request?.kind==='trade'?'<button class="primary" data-player-trade="'+id+'">Look for a new club</button>':'')+'<button id="n-ok">'+(m.request?'Keep them here for now':'Back to the field')+'</button>');}
function coachesTab(){let html='<p>Iona: A good teacher helps players grow into their promise. Coaches work with the roster and farm club. Age and player ceilings still apply.</p><p>Staff salaries come from cash, separate from player payroll. Pay once when signing, for next season only; no automatic renewal.</p>';for(const role of ['hitting','pitching']){const c=L.coaches?.[role];html+='<h3>'+ (role==='hitting'?'Hitting':'Pitching')+' coach</h3>';if(c){html+='<p><b>'+esc(c.name)+'</b> · '+money(c.salary)+' paid for season '+c.season+'. '+coachDescription(c)+'</p>';continue;}const candidates=coachCandidates(L,role);html+=candidates.length?'<div class="coach-grid">'+candidates.map(c=>'<article class="coach-card"><h4>'+esc(c.name)+'</h4><p>'+coachDescription(c)+'</p><p><b>'+money(c.salary)+'</b> for season '+c.season+'</p><button data-coach-role="'+role+'" data-coach="'+c.id+'" '+(L.cash<c.salary?'disabled':'')+'>Hire '+esc(c.name)+'</button></article>').join('')+'</div>':'<p>This job is open. Three candidates will visit during the offseason.</p>';}if(L.report?.coaching?.length)html+='<h3>Last winter’s coaching</h3>'+coachingReport(L.report);return html;}
function coachingReport(r){const labels={contact:'Contact',power:'Power',eye:'Eye',glove:'Glove',stuff:'Stuff',control:'Control',stamina:'Stamina'};return '<ul>'+r.coaching.map(x=>'<li>'+esc(x.name)+': '+Object.entries(x.gains).filter(([k,n])=>labels[k]&&Number.isInteger(n)&&n>0&&n<=2).map(([k,n])=>labels[k]+' +'+n).join(', ')+' from '+esc(x.coach)+'.</li>').join('')+'</ul>';}
function ratingCells(p){ return p.pitcher?'<td>'+p.stuff+'</td><td>'+p.control+'</td><td>'+p.stamina+'</td>':'<td>'+p.contact+'</td><td>'+p.power+'</td><td>'+p.eye+'</td><td>'+p.glove+'</td><td class="hide-sm">'+spd(p)+'</td>'; }
/* The ceiling the scouts see: exact with a good Scouting office, rounded ("about 70") without one. */
function ceilText(p){ if(p.age>27) return '-'; const v=scoutCeiling(L,p); return (L.upgrades.scouting>=2?'':'about ')+v; }
function ceilCell(p){ return '<td class="small">'+ceilText(p)+'</td>'; }
function seasonCell(p){ const st=p.season; if(!st||!st.g) return '<td class="small hide-sm">-</td>'; return p.pitcher?'<td class="small hide-sm">'+(st.w||0)+'-'+(st.l||0)+', '+era(st)+' ERA, '+(st.k||0)+' K</td>':'<td class="small hide-sm">'+avg(st.h,st.ab)+', '+(st.hr||0)+' HR, '+(st.rbi||0)+' RBI</td>'; }
function contractCell(p){ if(p.years>0) return '<td>'+money(p.salary)+' × '+p.years+' yr</td><td><button data-release="'+p.id+'">Let go</button>'+(p.age<=25?' <button data-senddown="'+p.id+'">To the farm</button>':'')+'</td>';
  return '<td><b>Ending</b></td><td><button class="primary" data-resign="'+p.id+'">Re-sign for '+money(askSalary(p,L.upgrades.clubhouse))+'</button> <button data-release="'+p.id+'">Let go</button></td>'; }
function rosterTab(){
  const c=you(), line=c.lineup.map(id=>pl(c,id)), bench=batters(c).filter(p=>!c.lineup.includes(p.id));
  return '<p>Payroll <b>'+money(payroll(c))+'</b> of the owner\'s budget of <b>'+money(c.budget)+'</b>. Roster '+c.players.length+' of '+DM.rosterMax+'. Ratings run from 0 to 99; overall is shown in bold. <b>Ceiling</b> is the best a young player can become, as far as the scouts can tell; they grow toward it each winter, faster when they play every day.</p>'+
   '<h3>Batting order</h3><p class="small">The top of the order bats most. Contact makes hits, Power makes extra bases and home runs, Eye draws walks, Glove stops the other side\'s hits, Speed takes extra bases (and makes a good pinch runner).</p><div class="scroll-x"><table class="tbl"><tr><th>#</th><th>Batter</th><th>Pos</th><th>Age</th><th>Overall</th><th>Ceiling</th><th>Contact</th><th>Power</th><th>Eye</th><th>Glove</th><th class="hide-sm">Speed</th><th class="hide-sm">This season</th><th>Order</th><th>Contract</th><th></th></tr>'+
   line.map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(p.name)+'</td><td>'+p.pos+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td>'+ceilCell(p)+ratingCells(p)+seasonCell(p)+'<td><button data-up="'+i+'" aria-label="Move '+esc(p.name)+' up" '+(i?'':'disabled')+'>▲</button><button data-down="'+i+'" aria-label="Move '+esc(p.name)+' down" '+(i<8?'':'disabled')+'>▼</button></td>'+contractCell(p)+'</tr>').join('')+
   bench.map(p=>'<tr><td>Bench</td><td>'+esc(p.name)+'</td><td>'+p.pos+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td>'+ceilCell(p)+ratingCells(p)+seasonCell(p)+'<td><button data-start="'+p.id+'">Start for №9</button></td>'+contractCell(p)+'</tr>').join('')+'</table></div>'+
   '<p><button data-auto>Let Iona set the order</button></p>'+
   '<h3>Pitchers</h3><p class="small">The five best pitchers start in turn. Stuff gets strikeouts, Control avoids walks, Stamina lets a starter throw more pitches before tiring; Iona will ask you about a tired pitcher during games you watch. Starters usually throw 90 to 120 pitches, then rest four days and start again on the fifth. A reliever who threw 45 pitches rests two days, 25 pitches one day; a short outing can pitch again tomorrow.</p><div class="scroll-x"><table class="tbl"><tr><th>Pitcher</th><th>Age</th><th>Overall</th><th>Ceiling</th><th>Stuff</th><th>Control</th><th>Stamina</th><th class="hide-sm">This season</th><th>Contract</th><th></th></tr>'+
   pitchers(c).sort((a,b)=>overall(b)-overall(a)).map(p=>'<tr><td>'+esc(p.name)+(rested(p,dayKey(L))?'':' <span class="small">resting today</span>')+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td>'+ceilCell(p)+ratingCells(p)+seasonCell(p)+contractCell(p)+'</tr>').join('')+'</table></div>'+
   '<p class="small">Letting a player go in the middle of a contract costs half a season\'s salary from the club\'s cash.</p>';
}
function pickList(c,side,ids){ return c.players.concat(c.farm||[]).sort((a,b)=>(!!a.prospect-!!b.prospect)||(a.pitcher-b.pitcher)||overall(b)-overall(a)).map(p=>'<label class="pick"><input type="checkbox" data-pick="'+side+'" value="'+p.id+'" '+(ids.includes(p.id)?'checked':'')+'> '+esc(p.name)+' <span class="small">'+(p.prospect?'farm club, ':'')+(p.pitcher?'P':p.pos)+', overall '+overall(p)+(p.age<=27?', ceiling '+ceilText(p):'')+', age '+p.age+', '+money(p.salary)+'</span></label>').join(''); }
const names=(c,ids)=>ids.map(id=>esc(clubPlayer(c,id).name)).join(' and ');
/* A found deal, written out, with buttons to make it or to load it into the trade table. */
function dealHTML(d){ if(!d) return ''; if(d.none) return '<div class="msg" role="status">'+esc(d.none)+'</div>';
  const them=club(d.club); return '<div class="msg ok" role="status">The '+esc(them.name)+' would trade <b>'+names(them,d.get)+'</b> for <b>'+names(you(),d.give)+'</b>.<br>Iona: '+esc(ionaOnDeal(d))+'<div class="row"><button class="primary" data-deal-do>Make this trade</button> <button data-deal-load>Change it in the trade table</button></div></div>'; }
function ionaOnDeal(d){ const g=d.give.map(id=>clubPlayer(you(),id)), t=d.get.map(id=>clubPlayer(club(d.club),id));
  const best=a=>Math.max(...a.map(overall)); return d.give.length>1||d.get.length>1?(best(t)>best(g)?'We get the best player in the deal.':'We give up the best player in the deal.'):ionaOnTrade(g[0],t[0]); }
function tradeTab(){
  const them=club(trade.club), mine=you().players.concat(you().farm||[]).sort((a,b)=>overall(b)-overall(a));
  const POS=[['any','Anyone'],['bat','Any batter'],['P','Pitchers']].concat(DM.batPos.map(p=>[p,p]));
  const fits=p=>finder.pos==='any'||(finder.pos==='bat'?!p.pitcher:finder.pos==='P'?p.pitcher:p.pos===finder.pos&&!p.pitcher);
  const market=[]; L.clubs.forEach((c,ci)=>{ if(ci!==DM.you) for(const p of c.players.concat(c.farm||[])) if(fits(p)) market.push({p,ci}); });
  market.sort((a,b)=>overall(b.p)-overall(a.p));
  return '<h3>Trade finder</h3><p>Press <b>Find a deal</b> on a player you want and Iona works out the cheapest offer that club would take, from our roster or our farm club. Or shop one of our players and hear the best each club would give.</p>'+
   '<p><label>Looking for <select id="find-pos">'+POS.map(([k,n])=>'<option value="'+k+'" '+(k===finder.pos?'selected':'')+'>'+n+'</option>').join('')+'</select></label></p>'+
   (finder.want?dealHTML(finder.deal):'')+
   '<div class="scroll-x"><table class="tbl"><tr><th>Player</th><th>Club</th><th>Pos</th><th class="hide-sm">Age</th><th>Overall</th><th class="hide-sm">Ceiling</th><th class="hide-sm">Salary</th><th></th></tr>'+
   market.slice(0,12).map(({p,ci})=>'<tr'+(finder.want===p.id?' class="you"':'')+'><td>'+esc(p.name)+(p.prospect?' <span class="small">farm club</span>':'')+'</td><td>'+esc(club(ci).short)+'</td><td>'+(p.pitcher?'P':p.pos)+'</td><td class="hide-sm">'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td><td class="small hide-sm">'+ceilText(p)+'</td><td class="hide-sm">'+money(p.salary)+'</td><td><button data-find="'+p.id+'" data-find-club="'+ci+'">Find a deal</button></td></tr>').join('')+'</table></div>'+
   '<p><label>Shop <select id="shop-pick">'+mine.map(p=>'<option value="'+p.id+'" '+(p.id===finder.shop?'selected':'')+'>'+esc(p.name)+' ('+(p.pitcher?'P':p.pos)+', overall '+overall(p)+(p.prospect?', farm club':'')+')</option>').join('')+'</select></label> <button id="shop-go">Hear offers</button></p>'+
   (finder.offers?(finder.offers.length?'<div class="scroll-x"><table class="tbl"><tr><th>Club</th><th>Would give</th><th>Pos</th><th class="hide-sm">Age</th><th>Overall</th><th class="hide-sm">Ceiling</th><th></th></tr>'+finder.offers.map((o,i)=>{const p=clubPlayer(club(o.club),o.get);return '<tr><td>'+esc(club(o.club).short)+'</td><td>'+esc(p.name)+(p.prospect?' <span class="small">farm club</span>':'')+'</td><td>'+(p.pitcher?'P':p.pos)+'</td><td class="hide-sm">'+p.age+'</td><td class="ovr">'+overall(p)+'</td><td class="small hide-sm">'+ceilText(p)+'</td><td><button class="primary" data-offer="'+i+'">Accept</button></td></tr>';}).join('')+'</table></div>':'<div class="msg" role="status">No club would make a one-for-one trade for that player that fits both rosters and budgets.</div>'):'')+
   '<h3>Build your own trade</h3><p>Pick a club, tick the players you would give and the players you want, then ask. Their general manager says yes or tells you how far apart you are. Young, highly rated players on fair salaries are worth the most, and so are prospects with a high ceiling.</p>'+
   '<p><label>Trade with <select id="trade-club">'+L.clubs.map((c,i)=>i===DM.you?'':'<option value="'+i+'" '+(i===trade.club?'selected':'')+'>'+esc(c.name)+' ('+c.w+'-'+c.l+')</option>').join('')+'</select></label></p>'+
   '<div class="cols"><div><h3>You give</h3>'+pickList(you(),'give',trade.give)+'</div><div><h3>You get, from the '+esc(them.short)+'</h3>'+pickList(them,'get',trade.get)+'</div></div>'+
   (trade.answer?'<div class="msg" role="status">'+esc(trade.answer)+'</div>':'')+
   '<p><button id="trade-ask">Ask what they think</button> <button id="trade-fill">What would make it work?</button> <button class="primary" id="trade-do">Propose the trade</button></p>';
}
function freeTab(){
  return '<p>Players without a club. They sign for the salary shown, as long as the payroll stays inside the owner\'s budget ('+money(payroll(you()))+' of '+money(you().budget)+'). Each winter two <b>standouts</b> arrive, the best players on the market; a better Scouting office makes them better still. <b>League minimum</b> players are always there and do not count against the budget, so you can always fill the roster.</p><div class="scroll-x"><table class="tbl"><tr><th>Player</th><th>Pos</th><th>Age</th><th>Overall</th><th>Ratings</th><th>Asks</th><th></th></tr>'+
   L.freeAgents.map(p=>'<tr><td>'+esc(p.name)+(p.star?' <b class="small">Standout</b>':p.bargain?' <span class="small">League minimum</span>':'')+'</td><td>'+(p.pitcher?'P':p.pos)+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td><td class="small">'+(p.pitcher?'Stuff '+p.stuff+', Control '+p.control+', Stamina '+p.stamina:'Contact '+p.contact+', Power '+p.power+', Eye '+p.eye+', Glove '+p.glove)+'</td><td>'+money(p.salary)+' × '+p.years+' yr</td><td><button class="primary" data-sign="'+p.id+'">Sign</button></td></tr>').join('')+'</table></div>';
}
function farmTab(){
  const c=you(), farm=c.farm||[], d=L.draft, live=d&&!d.done, row=(p,btns)=>'<tr><td>'+esc(p.name)+'</td><td>'+(p.pitcher?'P':p.pos)+'</td><td>'+p.age+'</td><td class="ovr">'+overall(p)+' <span class="small">'+word(overall(p))+'</span></td><td><b>'+ceilText(p)+'</b></td><td class="small hide-sm">'+(p.pitcher?'Stuff '+p.stuff+', Control '+p.control+', Stamina '+p.stamina:'Contact '+p.contact+', Power '+p.power+', Eye '+p.eye+', Glove '+p.glove)+'</td><td>'+btns+'</td></tr>';
  const head='<tr><th>Player</th><th>Pos</th><th>Age</th><th>Overall</th><th>Ceiling</th><th class="hide-sm">Ratings</th><th></th></tr>';
  let h='';
  if(live){ const n=d.pick+1, rd=Math.floor(d.pick/6)+1, others=d.picks.filter(x=>x.club!==DM.you).slice(-5);
    h+='<h3>The draft, round '+rd+' of 3</h3><p><b>We are on the clock: pick '+n+' of '+d.order.length+'.</b> The club with the worst record picks first in every round. Young prospects start on the farm club, cost nothing against the budget, and grow toward their ceiling. '+(L.upgrades.scouting>=2?'Our scouts can read each ceiling exactly.':'With '+(L.upgrades.scouting?'a small':'no')+' Scouting office our scouts can only guess ceilings to the nearest '+(L.upgrades.scouting?5:10)+'; building it up sharpens their eye.')+'</p>'+
      (others.length?'<p class="small">Just taken: '+others.map(x=>esc(x.name)+' ('+esc(club(x.club).short)+')').join(', ')+'.</p>':'')+
      '<p><button class="primary" data-draft-auto>Let Iona pick for us</button> <button data-draft-pass>Pass this pick</button></p>'+
      '<div class="scroll-x"><table class="tbl">'+head+d.pool.slice().sort((a,b)=>scoutCeiling(L,b)-scoutCeiling(L,a)||overall(b)-overall(a)).map(p=>row(p,'<button class="primary" data-draft="'+p.id+'" '+(farm.length>=FARM_MAX?'disabled':'')+'>Pick</button>')).join('')+'</table></div>'; }
  else if(d&&d.done&&d.picks.some(x=>x.club===DM.you&&x.id)) h+='<p>This winter we drafted '+d.picks.filter(x=>x.club===DM.you&&x.id).map(x=>esc(x.name)+' (round '+x.round+')').join(', ')+'.</p>';
  else h+='<p class="small">The draft happens every winter, after the final.</p>';
  h+='<h3>Farm club ('+farm.length+' of '+FARM_MAX+')</h3><p class="small">Farm players play every day, so they grow quickly. Call one up when ready (the rookie salary is '+money(150)+' and counts against the budget once they join the Lanterns). Players 25 and under on the roster can be sent down to play every day (their contract still counts against the budget); past 25, farm players leave for free agency.</p>'+
    (farm.length?'<div class="scroll-x"><table class="tbl">'+head+farm.slice().sort((a,b)=>overall(b)-overall(a)).map(p=>row(p,'<button class="primary" data-callup="'+p.id+'">Call up</button> <button data-farm-go="'+p.id+'">Let go</button>')).join('')+'</table></div>':'<p>Nobody on the farm club yet.</p>');
  return h;
}
/* Numbers for every player: this season, last season or a whole career, plus the league's leaders. */
let statView='season';
const era=st=>st.outs?(st.r*27/st.outs).toFixed(2):'-';
function statLine(p){ return statView==='season'?p.season:statView==='last'?p.last:p.career; }
function statsTab(){ const c=you(), live=L.phase!=='offseason';
  const pick='<p><label>Show <select id="stat-view">'+[['season','This season'],['last','Last season'],['career','Career']].map(([k,n])=>'<option value="'+k+'" '+(k===statView?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+(live?'':' <span class="small">The season is over; last season\'s numbers are under Last season.</span>')+'</p>';
  const bats=batters(c).map(p=>[p,statLine(p)]).filter(([,st])=>st&&st.g), arms=pitchers(c).map(p=>[p,statLine(p)]).filter(([,st])=>st&&st.g);
  const slg=st=>st.ab?((st.h+(st.d||0)+2*(st.t||0)+3*(st.hr||0))/st.ab).toFixed(3).replace(/^0/,''):'.000', obp=st=>(st.ab+(st.bb||0))?((st.h+(st.bb||0))/(st.ab+(st.bb||0))).toFixed(3).replace(/^0/,''):'.000';
  let h=(L.lastBox?'<p><button id="stat-box">Box score of the last game</button></p>':'')+pick+'<h3>Batting</h3>'+(bats.length?'<div class="scroll-x"><table class="tbl"><tr><th>Batter</th><th>G</th><th>AB</th><th>R</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>BB</th><th>K</th><th>SB</th><th>AVG</th><th>OBP</th><th>SLG</th></tr>'+
    bats.sort((a,b)=>b[1].ab-a[1].ab).map(([p,st])=>'<tr><td>'+esc(p.name)+' <span class="small">'+p.pos+'</span></td><td>'+st.g+'</td><td>'+st.ab+'</td><td>'+(st.r||0)+'</td><td>'+st.h+'</td><td>'+(st.d||0)+'</td><td>'+(st.t||0)+'</td><td>'+(st.hr||0)+'</td><td>'+(st.rbi||0)+'</td><td>'+(st.bb||0)+'</td><td>'+(st.k||0)+'</td><td>'+(st.sb||0)+'</td><td><b>'+avg(st.h,st.ab)+'</b></td><td>'+obp(st)+'</td><td>'+slg(st)+'</td></tr>').join('')+'</table></div>':'<p class="small">No games yet.</p>')+
    '<h3>Pitching</h3>'+(arms.length?'<div class="scroll-x"><table class="tbl"><tr><th>Pitcher</th><th>G</th><th>GS</th><th>W</th><th>L</th><th>IP</th><th>H</th><th>R</th><th>BB</th><th>K</th><th>HR</th><th>ERA</th></tr>'+
    arms.sort((a,b)=>(b[1].outs||0)-(a[1].outs||0)).map(([p,st])=>'<tr><td>'+esc(p.name)+'</td><td>'+st.g+'</td><td>'+(st.gs||0)+'</td><td>'+(st.w||0)+'</td><td>'+(st.l||0)+'</td><td>'+ip(st.outs||0)+'</td><td>'+(st.h||0)+'</td><td>'+(st.r||0)+'</td><td>'+(st.bb||0)+'</td><td>'+(st.k||0)+'</td><td>'+(st.hr||0)+'</td><td><b>'+era(st)+'</b></td></tr>').join('')+'</table></div>':'<p class="small">No games yet.</p>');
  // League leaders, this season (or last season in the winter).
  const key=live?'season':'last', all=L.clubs.flatMap((cl,i)=>cl.players.map(p=>({p,i,st:p[key]}))).filter(x=>x.st&&x.st.g), gp=Math.max(1,...L.clubs.map(cl=>cl.w+cl.l));
  const top=(list,val,fmt,asc)=>list.slice().sort((a,b)=>asc?val(a)-val(b):val(b)-val(a)).slice(0,5).map((x,n)=>'<li'+(x.i===DM.you?' class="us"':'')+'>'+(n+1)+'. '+esc(x.p.name)+' <span class="small">'+esc(club(x.i).short)+'</span> <b>'+fmt(x)+'</b></li>').join('');
  const hit=all.filter(x=>!x.p.pitcher), qual=hit.filter(x=>x.st.ab>=Math.max(1,gp*2.4)), arm=all.filter(x=>x.p.pitcher), qa=arm.filter(x=>(x.st.outs||0)>=gp*2.4);
  h+='<h3>League leaders'+(live?'':' (last season)')+'</h3><p class="small">Batting average and ERA count players with enough at bats or innings.</p><div class="leaders">'+
    '<div><h4>Batting average</h4><ol>'+top(qual,x=>x.st.h/x.st.ab,x=>avg(x.st.h,x.st.ab))+'</ol></div>'+
    '<div><h4>Home runs</h4><ol>'+top(hit,x=>x.st.hr||0,x=>x.st.hr||0)+'</ol></div>'+
    '<div><h4>Stolen bases</h4><ol>'+top(hit,x=>x.st.sb||0,x=>x.st.sb||0)+'</ol></div>'+
    '<div><h4>Runs batted in</h4><ol>'+top(hit,x=>x.st.rbi||0,x=>x.st.rbi||0)+'</ol></div>'+
    '<div><h4>ERA</h4><ol>'+top(qa,x=>x.st.r*27/x.st.outs,x=>era(x.st),true)+'</ol></div>'+
    '<div><h4>Strikeouts</h4><ol>'+top(arm,x=>x.st.k||0,x=>x.st.k||0)+'</ol></div>'+
    '<div><h4>Wins</h4><ol>'+top(arm,x=>x.st.w||0,x=>x.st.w||0)+'</ol></div></div>';
  return h;
}
function parkTab(){
  return '<p>The club\'s cash comes from the gate at home games: more wins and a better park bring bigger crowds. Upgrades show on the field.</p><p>Last home crowd: '+(()=>{const g=gateMoney(L);return g.crowd.toLocaleString()+' of '+g.cap.toLocaleString()+' seats ('+money(g.money)+' a game at '+'$'+DM.ticket+' a ticket)';})()+'. Cash: <b>'+money(L.cash)+'</b>.</p>'+
   '<div class="upg">'+Object.entries(DM.upgrades).map(([k,u])=>{const lv=L.upgrades[k],max=u.cost.length;return '<div><h3>'+u.name+'</h3><div class="dots" aria-label="Level '+lv+' of '+max+'">'+'●'.repeat(lv)+'○'.repeat(max-lv)+'</div><p class="small">'+u.what+'</p>'+(lv<max?'<button class="primary" data-up-park="'+k+'" '+(L.cash>=u.cost[lv]?'':'disabled')+'>Build for '+money(u.cost[lv])+'</button>':'<b>Finished</b>')+'</div>';}).join('')+'</div>';
}
function leagueTab(){
  const s=standings(L);
  return '<h3>Standings, season '+L.season+'</h3><div class="scroll-x"><table class="tbl"><tr><th></th><th>Club</th><th>Won</th><th>Lost</th><th>Runs for</th><th>Runs against</th><th>Average overall</th></tr>'+
   s.map((x,i)=>'<tr class="'+(x.i===DM.you?'you':'')+'"><td>'+(i+1)+'</td><td>'+esc(x.c.name)+'</td><td>'+x.c.w+'</td><td>'+x.c.l+'</td><td>'+x.c.rs+'</td><td>'+x.c.ra+'</td><td>'+Math.round(x.c.players.reduce((n,p)=>n+overall(p),0)/x.c.players.length)+'</td></tr>').join('')+'</table></div>'+
   (L.final?'<p>The final: '+esc(club(L.final.teams[0]).short)+' '+L.final.wins[0]+', '+esc(club(L.final.teams[1]).short)+' '+L.final.wins[1]+'.</p>':'<p class="small">After '+DM.seasonGames+' games the top two meet in a best-of-three final.</p>')+
   seasonHistoryHTML()+
   (L.log.length?'<h3>Trades</h3><ul>'+L.log.slice(-8).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'');
}

/* Confirmation stays inside the game, with the cost visible before choosing. */
function confirmRelease(p) { return confirmAsk('Let ' + p.name + ' go? ' + (p.years > 0 ? 'The club pays ' + money(Math.round(p.salary / 2)) + ' to end the contract.' : 'The contract is ending, so there is no release fee.')); }
function confirmAsk(text) {
  const dialog = $('#decision-dialog');
  $('#decision-text').textContent = text;
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
  if(id==='a-play'||id==='a-sim'){ const g=startDay(L,id==='a-play'); if(!g) return; save(); watch(g,id==='a-sim'); }
  else if(id==='a-final'){ const inIt=L.final.teams.includes(DM.you), g=startFinalGame(L,inIt); if(!g) return; save(); watch(g,!inIt); }
  else if(id==='a-skip'){ closeNote(); finishGame(L,view.g); pump(performance.now()); view.done=true; view.paused=false; save(); render(); }
  else if(id==='a-speed'){ L.speed=L.speed%3+1; save(); render(); }
  else if(id==='a-moves'){ view.g.hold=true; render(); }
  else if(id==='a-box'){ boxNote(); }
  else if(id==='a-after'){ const g=L.live.final?finishFinalGame(L):finishDay(L); save(); view=null; lastActions=''; afterGameNote(g); render(); }
  else if(id==='g-yes'||id==='g-no'){ const r=answerAsk(L,view.g,id==='g-yes'); closeNote(); view.paused=false; pump(performance.now()); save(); if(r){ flash=r; } render(); }
  else if(id==='g-moves'){ answerAsk(L,view.g,false); movesNote(''); }
  else if(id==='g-resume'){ if(view){ view.g.hold=false; view.paused=false; closeNote(); render(); } else showOffseasonOrNext(); }
  else if(id==='a-office'||id==='n-office'){ openOffice(id==='n-office'?'roster':null); }
  else if(id==='n-history'){ openOffice('league'); }
  else if(id==='a-season'){ if(startSeason(L)){ save(); $('#feed').replaceChildren(); render(); } }
  else if(id==='n-ok'){ showOffseasonOrNext(); }
  else if(id==='n-yes'||id==='n-no'){ const r=answerOffer(L,id==='n-yes'); save(); if(r) return note('<div class="who">Iona Vale</div><p>'+esc(r)+'</p>', '<button class="primary" id="n-ok">Back to the field</button>'); showOffseasonOrNext(); }
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button'); if(!b||b.disabled) return;
  if(b.id&&(b.id.startsWith('a-')||b.id.startsWith('n-')||b.id.startsWith('g-'))) return act(b.id);
  if(view&&(b.dataset.mvP||b.dataset.mvPh||b.dataset.mvPr||b.dataset.mvD||b.dataset.mvS)){ const g=view.g, side=g.manage; let m;
    if(b.dataset.mvP) m=changePitcher(L,g,side,Number(b.dataset.mvP))||'✓ The new pitcher is warming up.';
    else if(b.dataset.mvPh) m=pinchHit(L,g,side,Number(b.dataset.mvPh))||'✓ The pinch hitter is in.';
    else if(b.dataset.mvPr){ const [base,id]=b.dataset.mvPr.split(':').map(Number); m=pinchRun(L,g,side,base,id)||'✓ The pinch runner is in.'; }
    else if(b.dataset.mvD){ const [out,id]=b.dataset.mvD.split(':').map(Number); m=defensiveSub(L,g,side,out,id)||'✓ The defensive change is made.'; }
    else m=sendRunner(L,g,side,Number(b.dataset.mvS))||'✓ The runner goes on the next pitch.';
    pump(performance.now()); save(); return movesNote(m); }
  if(b.id==='close-office') return closeOffice();
  if(b.dataset.tab){ tab=b.dataset.tab; flash=''; return renderOffice(); }
  if(b.id==='stat-box'){ closeOffice(); return boxNote(); }

  if(b.dataset.playerStory){closeOffice();return playerStoryNote(Number(b.dataset.playerStory));}
  if(b.dataset.playerDeal){const id=Number(b.dataset.playerDeal),error=offerPlayerDeal(L,id);save();if(error)return playerStoryNote(id,error);const p=pl(you(),id);render();note('<div class="who">Iona Vale, field manager</div><h2>A deal for the road ahead</h2><p>'+esc(p.name)+' has signed for '+money(p.salary)+' a season. They know you listened.</p>','<button class="primary" id="n-ok">Back to the field</button>');return;}
  if(b.dataset.playerTrade){const id=Number(b.dataset.playerTrade);trade={club:1,give:[id],get:[],answer:''};return openOffice('trades');}
  const c=you(); let r=null;
  if(b.dataset.up!==undefined||b.dataset.down!==undefined){ const i=Number(b.dataset.up??b.dataset.down), j=b.dataset.up!==undefined?i-1:i+1; const l=c.lineup.slice(); [l[i],l[j]]=[l[j],l[i]]; c.lineup=l; r=''; }
  else if(b.dataset.start){ const l=c.lineup.slice(); l[8]=Number(b.dataset.start); c.lineup=l; setLineup(c,l); r=''; }
  else if(b.dataset.auto!==undefined){ autoLineup(c); r='✓ Iona set the order: best on-base hitters first, power in the middle.'; }
  else if(b.dataset.resign){ const p=pl(c,Number(b.dataset.resign)); r=resign(L,Number(b.dataset.resign))||'✓ '+p.name+' signed again.'; }
  else if(b.dataset.release){ const p=pl(c,Number(b.dataset.release)); if(!await confirmRelease(p))return; r=release(L,Number(b.dataset.release))||'✓ '+p.name+' has left the club.'; }
  else if(b.dataset.coach){ r=hireCoach(L,b.dataset.coachRole,b.dataset.coach)||'The coach joins us for next season.'; }
  else if(b.dataset.sign){ const p=L.freeAgents.find(x=>x.id===Number(b.dataset.sign)); r=signFree(L,Number(b.dataset.sign))||'✓ '+p.name+' joins the Lanterns.'; }
  else if(b.dataset.senddown){ const p=pl(c,Number(b.dataset.senddown)); r=sendDown(L,p.id)||'✓ '+p.name+' goes to the farm club to play every day.'; }
  else if(b.dataset.callup){ const p=c.farm.find(x=>x.id===Number(b.dataset.callup)); r=callUp(L,p.id)||'✓ '+p.name+' joins the Lanterns.'; }
  else if(b.dataset.farmGo){ const p=c.farm.find(x=>x.id===Number(b.dataset.farmGo)); if(!await confirmAsk('Let '+p.name+' go from the farm club? Another club may sign them.'))return; r=releaseFarm(L,p.id)||'✓ '+p.name+' has left the farm club.'; }
  else if(b.dataset.draft){ const p=L.draft.pool.find(x=>x.id===Number(b.dataset.draft)); r=draftPick(L,p.id)||'✓ We drafted '+p.name+'.'+(L.draft.done?' The draft is over.':''); }
  else if(b.dataset.draftPass!==undefined){ r=draftPass(L)||'✓ We passed.'+(L.draft.done?' The draft is over.':''); }
  else if(b.dataset.draftAuto!==undefined){ const before=(c.farm||[]).length; draftAuto(L); const got=(c.farm||[]).slice(before).map(p=>p.name); r='✓ '+(got.length?'Iona drafted '+got.join(', ')+'.':'Iona passed: the farm club is full.')+' The draft is over.'; }
  else if(b.dataset.upPark){ r=buyUpgrade(L,b.dataset.upPark)||'✓ The '+DM.upgrades[b.dataset.upPark].name.toLowerCase()+' are built.'; }
  else if(b.dataset.find){ const ci=Number(b.dataset.findClub), id=Number(b.dataset.find), g=findDeal(L,ci,id); finder.want=id;
    finder.deal=g?{club:ci,give:g,get:[id]}:{none:'Nothing we have would get '+clubPlayer(club(ci),id).name+' without breaking our budget or roster rules. Free up money or roster room, or build up the farm club.'}; r=''; }
  else if(b.dataset.dealDo!==undefined){ const d=finder.deal; const x=doTrade(L,d.club,d.give,d.get); r=x||'✓ Done. '+names(you(),d.get)+' joined us.'; finder.want=null; finder.deal=null; finder.offers=null; }
  else if(b.dataset.dealLoad!==undefined){ const d=finder.deal; trade={club:d.club,give:d.give.slice(),get:d.get.slice(),answer:''}; finder.want=null; finder.deal=null; r=''; }
  else if(b.id==='shop-go'){ finder.shop=Number($('#shop-pick').value); finder.offers=shopPlayer(L,finder.shop); r=''; }
  else if(b.dataset.offer){ const o=finder.offers[Number(b.dataset.offer)], p=clubPlayer(club(o.club),o.get); const x=doTrade(L,o.club,[finder.shop],[o.get]); r=x||'✓ Done. '+p.name+' joined us.'; finder.offers=null; }
  else if(b.id==='trade-fill'){ const g=completeDeal(L,trade.club,trade.give,trade.get); if(!trade.get.length) trade.answer='Tick at least one player you want first.'; else if(!g) trade.answer='Nothing more we could add would make it work. Try asking for less, or check the budget and roster limits.'; else { const added=g.filter(id=>!trade.give.includes(id)); trade.give=g; trade.answer=added.length?'They would also want '+names(you(),added)+'. Those are ticked now; propose it if you agree.':'They would already take that. Propose it.'; } r=''; }
  else if(b.id==='trade-ask'){ trade.answer=judgeTrade(L,trade.club,trade.give,trade.get).why; r=''; }
  else if(b.id==='trade-do'){ const x=doTrade(L,trade.club,trade.give,trade.get); trade.answer=x||'Done. The new players are on your roster.'; if(!x){trade.give=[];trade.get=[];} r=''; }
  if(r!==null){ if(r)flash=r; save(); render(); }
});
document.addEventListener('change',e=>{
  if(e.target.id==='stat-view'){ statView=e.target.value; renderOffice(); }
  else if(e.target.id==='find-pos'){ finder.pos=e.target.value; finder.want=null; finder.deal=null; renderOffice(); }
  else if(e.target.id==='shop-pick'){ finder.shop=Number(e.target.value); finder.offers=null; renderOffice(); }
  else if(e.target.id==='trade-club'){ trade={club:Number(e.target.value),give:trade.give,get:[],answer:''}; renderOffice(); }
  else if(e.target.dataset.pick){ const k=e.target.dataset.pick, id=Number(e.target.value); trade[k]=e.target.checked?trade[k].concat(id):trade[k].filter(x=>x!==id); trade.answer=''; }
});
document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]')||document.querySelector('.arc-set-bg:not([hidden])'))return;
  if(e.key==='Escape'){ if(!$('#office').hidden)closeOffice(); return; }
  if(e.target.closest('input,select,textarea,button,a')||!$('#office').hidden) return;
  if(e.key==='f'||e.key==='F'){ if(!view)openOffice(); return; }
  if((e.key==='m'||e.key==='M')&&view&&!view.done&&$('#note').hidden){ const b=$('#a-moves'); if(b&&!b.disabled)b.click(); return; }
  if((e.key==='b'||e.key==='B')&&view&&$('#note').hidden){ boxNote(); return; }
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
function frame(now){ stepWatch(now); fieldSize=drawField($('#field'),L,view?view.scene:null); requestAnimationFrame(frame); }
render(); requestAnimationFrame(frame);
if(L.intro) introNote(); else if(L.live) watch(L.live.g,false); else showOffseasonOrNext();
if(location.hostname==='localhost') window.__dm={get L(){return L;},set L(v){L=v;render();},DM,freshSeasonLedger,rememberGame,archiveSeason,winnerOf,clubRecords,validSeasonLedger,validSeasonHistory,marketLevel,fillFreeAgents,addStandouts,freshMorale,playerMorale,moodWord,moraleAsk,validMorale,recordMood,offerPlayerDeal,playerStory,coachCandidates,hireCoach,coachingGain,validCoachState,newLeague,playGame,playDay,playFinalGame,recordGame,standings,overall,askSalary,payroll,batters,pitchers,setLineup,autoLineup,makeSchedule,plateAppearance,gateMoney,endSeason,canStartSeason,startSeason,resign,release,signFree,buyUpgrade,worth,judgeTrade,doTrade,aiOffer,answerOffer,validLeague,loadLeague,migrateLeague,rosterOk,render,potentialFor,defensiveSub,sendRunner,rested,starterOf,dayKey,newGame,stepGame,finishGame,startDay,finishDay,startFinalGame,finishFinalGame,changePitcher,pinchHit,pinchRun,answerAsk,benchOf,bullpenOf,effective,pitchLimit,boxScore,speedFor,findDeal,completeDeal,shopPlayer,tradeRating,clubPlayer,scoutCeiling,makeProspect,develop,playsDaily,startDraft,draftPick,draftPass,draftAuto,callUp,sendDown,releaseFarm,FARM_MAX};
function awardWords(p,pitcher){if(!p)return 'No qualifying player';const s=p.stats;return esc(p.name)+' ('+(p.club<0?'Two clubs':esc(DM.clubs[p.club].short))+'): '+(pitcher?pitcherScore(s).toFixed(2)+' ERA, '+(s.k||0)+' strikeouts':hitterScore(s).toFixed(3)+' OPS, '+(s.hr||0)+' home runs');}
function trophyCaseHTML(){const cups=[];for(const h of L.history){if(h.champion)cups.push({title:'League Champions',year:h.season,text:'The Lanterns brought it home.'});for(const[k,label]of [['hitter','Best Hitter'],['pitcher','Best Pitcher']]){const p=h.awards?.[k];if(p?.club===DM.you)cups.push({title:label,year:h.season,text:p.name});}}return '<h3>The Trophy Case</h3>'+(cups.length?'<div class="coach-grid">'+cups.map(c=>'<article class="coach-card trophy"><span class="cup" aria-hidden="true"><i></i></span><h4>'+c.title+'</h4><p>'+esc(c.text)+'</p><p>Season '+c.year+'</p></article>').join('')+'</div>':'<p>The shelves are waiting. League titles and our players’ league awards belong here.</p>')+'<h3>Club Records</h3>'+recordsHTML();}
function recordsHTML(){const labels={hits:'Hits',homeRuns:'Home runs',runsBattedIn:'Runs batted in',strikeouts:'Strikeouts',pitcherWins:'Pitcher wins'},rows=clubRecords(L);return rows.length?'<ul>'+rows.map(r=>'<li><b>'+labels[r.key]+': '+r.value+'</b> — '+esc(r.name)+', season '+r.season+'</li>').join('')+'</ul>':'<p>Complete a recorded season to put the first names in the book.</p>';}
function seasonHistoryHTML(){if(!L.history.length)return '<h3>The Season Ledger</h3><p>The first season is still being written.</p>';return '<h3>The Season Ledger</h3><div class="scroll-x"><table class="tbl"><tr><th>Season</th><th>Won</th><th>Lost</th><th>Place</th><th>League Champion</th></tr>'+L.history.map(h=>'<tr><td>'+h.season+'</td><td>'+h.w+'</td><td>'+h.l+'</td><td>'+nth(h.place)+'</td><td>'+esc(h.championName||'Not recorded')+'</td></tr>').join('')+'</table></div><p class="small">Awards use regular-season stats: Best Hitter is highest OPS with at least 60 at-bats; Best Pitcher is lowest ERA with at least 30 innings. Equal scores use home runs / strikeouts, then player number.</p>'+L.history.slice().reverse().map(h=>'<article class="coach-card"><h4>Season '+h.season+' Awards</h4>'+(h.completeStats?'<p>Best Hitter: '+awardWords(h.awards.hitter,false)+'</p><p>Best Pitcher: '+awardWords(h.awards.pitcher,true)+'</p>':'<p>Complete stats were not recorded for this season. Its results remain; awards and player records are not reconstructed.</p>')+(h.standings?'<details><summary>Final league standings</summary><ul>'+h.standings.slice().sort((a,b)=>b.w-a.w||(b.rs-b.ra)-(a.rs-a.ra)).map(c=>'<li>'+esc(c.name)+': '+c.w+'-'+c.l+'</li>').join('')+'</ul></details>':'')+'</article>').join('');}
