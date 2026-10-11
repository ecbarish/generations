'use strict';
/* Diamond Manager: the league, its players and the game simulation. No drawing here, so checks can run it.
   Money is in thousands of dollars (game currency): 1500 means $1.5M. Every random roll goes through one seeded
   generator, so a seeded league and its games are reproducible. */
const DM = {
  key: 'diamond-manager-save-v1', you: 0, seasonGames: 30, rosterMax: 18, minBatters: 9, minPitchers: 5,
  clubs: [
    {name:'Brackenport Lanterns', short:'Lanterns', park:'Lamplight Field', color:'#ffd281', level:48},
    {name:'Alder Quay Terns', short:'Terns', park:'Gullwing Park', color:'#9fd3e6', level:56},
    {name:'Copperbank Rivets', short:'Rivets', park:'The Foundry Yard', color:'#e39b6a', level:58},
    {name:'Windlecross Kites', short:'Kites', park:'Highmeadow Grounds', color:'#c7b6f2', level:54},
    {name:'Saltmere Gulls', short:'Gulls', park:'Breakwater Field', color:'#f2f0e4', level:53},
    {name:'Fennick Hollow Owls', short:'Owls', park:'Lantern Wood Park', color:'#a7d39a', level:55}
  ],
  first: ['Remi','Kit','Ada','Sol','Jules','Nell','Tavi','Pax','Milo','Sera','Orin','Bram','Ivo','Lena','Cass','Dov','Ezra','Fern','Gus','Hale','Isla','Joss','Kai','Lou','Mara','Nico','Odile','Pip','Quill','Rook','Sage','Teo','Una','Vic','Wren','Yara','Zeb','Arlo','Bea','Cy'],
  last: ['Moss','Fenner','Lorne','Becket','Orrin','Calder','Reed','Alder','Venn','Penn','Bell','Hollis','Marsh','Tamsin','Crane','Duvall','Ember','Flint','Garrow','Hythe','Ives','Jory','Kestrel','Lowe','Merrow','Nash','Okafor','Pryce','Quint','Rowan','Stroud','Thorne','Usher','Vale','Weller','Yew','Zane','Ashby','Brook','Coll'],
  batPos: ['C','1B','2B','3B','SS','LF','CF','RF','DH'],
  upgrades: {
    seats:    {name:'Seats', what:'More seats: more people can come to each home game.', cost:[300,600,1000,1500]},
    lights:   {name:'Lights', what:'Bright towers: night games draw a bigger crowd.', cost:[400,800,1200]},
    training: {name:'Training rooms', what:'Players aged 27 or younger grow two extra points a season per level.', cost:[350,700,1100]},
    scouting: {name:'Scouting office', what:'The two standout free agents each winter are better, and so is the rest of the market.', cost:[300,650,1000]},
    clubhouse:{name:'Clubhouse', what:'Happier players ask 5% less to stay, per level.', cost:[300,600,900]}
  },
  ticket: 20, words: [[80,'Star'],[70,'Excellent'],[62,'Good'],[54,'Solid'],[46,'Fair'],[0,'Raw']]
};
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const copy = o => JSON.parse(JSON.stringify(o));
function rnd(r) { r.seed = (Math.imul(r.seed >>> 0,1664525) + 1013904223) >>> 0; return r.seed / 4294967296; }
function ri(r,a,b) { return a + Math.floor(rnd(r)*(b-a+1)); }
function money(k) { const a=Math.abs(k), s=k<0?'-':''; return a>=1000 ? s+'$'+(a/1000).toFixed(a%1000?2:1).replace(/0$/,'')+'M' : s+'$'+a+'K'; }
function word(n) { return DM.words.find(w=>n>=w[0])[1]; }

function overall(p) {
  return Math.round(p.pitcher ? (p.stuff*.45+p.control*.35+p.stamina*.2) : (p.contact*.35+p.power*.25+p.eye*.2+p.glove*.2));
}
function askSalary(p, clubhouse=0) {
  const o=overall(p), base=250+Math.pow(Math.max(0,o-45),1.8)*6, age=p.age<=24?.9:p.age>=33?.8:1;
  return Math.round(base*age*(1-.05*clubhouse)/10)*10;
}
function makePlayer(r, id, level, pitcher, pos) {
  const age=ri(r,21,34), g=()=>clamp(Math.round(level+(rnd(r)+rnd(r)-1)*14),25,92);
  const p={id, name:DM.first[ri(r,0,DM.first.length-1)]+' '+DM.last[ri(r,0,DM.last.length-1)], age, pitcher:!!pitcher};
  if(pitcher) Object.assign(p,{pos:'P',stuff:g(),control:g(),stamina:g()});
  else Object.assign(p,{pos,contact:g(),power:g(),eye:g(),glove:g(),speed:speedFor(id,age)});
  p.salary=askSalary(p); p.years=ri(r,1,3); p.pot=potentialFor(r,p); return p;
}
/* Speed (batters only) takes extra bases and makes a pinch runner; it is not part of overall. Drawn from the id so old
   saves can be given the same number. */
function speedFor(id,age) { return clamp(32+((Math.imul(id,2654435761)>>>0)%46)-Math.max(0,age-28)*2,25,90); }
/* Potential: the best overall a player can reach. Young players have room to grow; veterans are what they are. */
function potentialFor(r,p) { const o=overall(p); return Math.min(92, o+(p.age<=24?ri(r,3,18):p.age<=27?ri(r,0,8):0)); }
/* What the club's scouts can tell about a ceiling: to the nearest 10 with no Scouting office, to the nearest 5 at
   level 1, exact from level 2. */
function scoutCeiling(L,p) { const lv=L.upgrades.scouting, step=lv>=2?1:lv===1?5:10; return Math.round((p.pot||overall(p))/step)*step; }
function makeProspect(r,id) { const pitcher=rnd(r)<.4, p=makePlayer(r,id,ri(r,36,46),pitcher,DM.batPos[ri(r,0,8)]);
  p.age=ri(r,18,21); p.pot=Math.min(86,overall(p)+ri(r,6,30)); p.salary=150; p.years=3; p.prospect=true; return p; }
function newLeague(seed=1) {
  const L={game:'diamond-manager', schema:1, seed:seed>>>0, nextId:1, season:1, day:0, cash:600, phase:'season',
    clubs:[], schedule:[], results:[], log:[], inbox:[], freeAgents:[], upgrades:{seats:0,lights:0,training:0,scouting:0,clubhouse:0},
    speed:1, intro:true, history:[], final:null, offer:null, sound:0, dmb:true, dmc:true, dmd:true, draft:null, live:null};
  DM.clubs.forEach((c,i)=>{
    const club={name:c.name, short:c.short, w:0, l:0, rs:0, ra:0, budget:i===0?10500:13500, players:[], lineup:[], rot:0};
    DM.batPos.forEach(pos=>club.players.push(makePlayer(L,L.nextId++,c.level,false,pos)));
    for(let k=0;k<6;k++) club.players.push(makePlayer(L,L.nextId++,c.level,true));
    club.players.push(makePlayer(L,L.nextId++,c.level-4,false,DM.batPos[ri(L,0,7)]));
    fitPayroll(L,club); setLineup(club); club.farm=[makeProspect(L,L.nextId++),makeProspect(L,L.nextId++)]; L.clubs.push(club);
  });
  L.schedule=makeSchedule(DM.seasonGames);
  fillFreeAgents(L, 8); addStandouts(L);
  return L;
}
/* AI clubs, and the opening rosters, keep their payroll inside their budget by trimming salaries. */
function fitPayroll(L,club) { let over=payroll(club)-club.budget; if(over<=0)return; const f=club.budget/payroll(club); club.players.forEach(p=>p.salary=Math.max(200,Math.round(p.salary*f/10)*10)); }
// League-minimum players (bargains) don't count against the owner's budget, so a roster can always be filled.
/* Players sent down to the farm club on a big-league contract still draw that salary. */
function payroll(club) { return club.players.concat(club.farm||[]).reduce((n,p)=>n+(p.bargain||(p.prospect&&!p.sent)?0:p.salary),0); }
function batters(club) { return club.players.filter(p=>!p.pitcher); }
function pitchers(club) { return club.players.filter(p=>p.pitcher); }
/* Keep the chosen order; add any missing batters by overall; drop anyone who left. */
function setLineup(club, order) {
  const ids=new Set(batters(club).map(p=>p.id));
  let line=(order||club.lineup||[]).filter(id=>ids.has(id));
  const rest=batters(club).filter(p=>!line.includes(p.id)).sort((a,b)=>overall(b)-overall(a)).map(p=>p.id);
  club.lineup=line.concat(rest).slice(0,9);
}
function autoLineup(club) { club.lineup=[]; setLineup(club); const by=id=>club.players.find(p=>p.id===id);
  // Best on-base first, power in the middle: a familiar baseball order.
  const l=club.lineup.map(by); l.sort((a,b)=>(b.eye+b.contact)-(a.eye+a.contact)); const top=l.slice(0,2), mid=l.slice(2).sort((a,b)=>b.power-a.power);
  club.lineup=top.concat(mid).map(p=>p.id); }
/* Round robin by the circle method, repeated with home and away swapped. */
function makeSchedule(n) {
  const t=[0,1,2,3,4,5], rounds=[];
  for(let r=0;r<5;r++){ const a=[t[0]].concat(t.slice(1).map((_,i)=>t[1+((i+r)%5)])); const day=[]; for(let i=0;i<3;i++)day.push([a[i],a[5-i]]); rounds.push(day); }
  const s=[]; for(let d=0;d<n;d++){ const day=rounds[d%5]; s.push(day.map(([h,a])=>Math.floor(d/5)%2?[a,h]:[h,a])); }
  return s;
}

/* One plate appearance from ratings. Returns 'walk','k','out' or 1-4 bases. */
function plateAppearance(r,b,p,glove) {
  const walk=clamp(.085+(b.eye-50)*.0016-(p.control-50)*.0013,.03,.17);
  const k=clamp(.20+(p.stuff-50)*.0032-(b.contact-50)*.0026,.08,.36);
  const x=rnd(r); if(x<walk)return 'walk'; if(x<walk+k)return 'k';
  const hit=clamp(.30+(b.contact-50)*.0022-(glove-50)*.0016-(p.stuff-50)*.0008,.2,.42);
  if(rnd(r)>hit) return 'out';
  const hr=clamp(.10+(b.power-50)*.0045-(p.stuff-50)*.001,.02,.3), y=rnd(r);
  return y<hr?4 : y<hr+.02?3 : y<hr+.22?2 : 1;
}

/* Rest, the way big-league clubs handle it: a starter who went deep (75 pitches or more) takes four days off and pitches
   every fifth day; 45 or more means two days off, 25 or more one day; a short relief outing can go again tomorrow.
   key counts days. */
function restDays(pitches) { return pitches>=75?5:pitches>=45?3:pitches>=25?2:1; }
function rested(p,key) { const r=p.rest; return !r||key===undefined||key-r.day>=restDays(r.pitches); }
function starterOf(club,key) { const ps=pitchers(club).slice().sort((a,b)=>overall(b)-overall(a)).slice(0,5);
  for(let k=0;k<ps.length;k++){ const p=ps[(club.rot+k)%ps.length]; if(rested(p,key)) return p; } return ps[club.rot%ps.length]; }
function dayKey(L) { return L.season*100+(L.phase==='final'&&L.final?30+L.final.games.length:L.day); }
function nth(n){return n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');}

/* Record a played game into the standings and the season stats. */
function recordGame(L,g) {
  const h=L.clubs[g.home], a=L.clubs[g.away];
  h.rs+=g.score[1]; h.ra+=g.score[0]; a.rs+=g.score[0]; a.ra+=g.score[1];
  if(g.winner===g.home){h.w++;a.l++;}else{a.w++;h.l++;}
  h.rot++; a.rot++;
  for(const c of [h,a]) for(const p of c.players){ const s=g.box[p.id], ps=g.pbox&&g.pbox[p.id]; if(!s&&!ps) continue; p.season=p.season||{g:0}; if(ps&&g.key!==undefined) p.rest={day:g.key,pitches:ps.pitches};
    for(const k in s||ps) p.season[k]=(p.season[k]||0)+(s||ps)[k]; p.season.g=(p.season.g||0)+1;
    if(ps){ if(g.starters&&g.starters.includes(p.id)) p.season.gs=(p.season.gs||0)+1; if(g.decision&&g.decision.w===p.id) p.season.w=(p.season.w||0)+1; if(g.decision&&g.decision.l===p.id) p.season.l=(p.season.l||0)+1; } }
}
function gateMoney(L) {
  const you=L.clubs[DM.you], gp=you.w+you.l, pct=gp?you.w/gp:.5, cap=6000+3000*L.upgrades.seats;
  const demand=Math.round(3500+pct*7000+L.upgrades.lights*1500+(L.history.length?L.history.filter(h=>h.champion).length*800:0));
  const crowd=Math.min(cap,demand); return {crowd, cap, money:Math.round(crowd*DM.ticket/1000)};
}
/* A day of the season. startDay sets up our game (L.live) for watching and managing; finishDay records it, plays the
   other games and moves the season on. playDay does both at once, with Iona managing (Sim this game, the tests). */
function daySeed(L,i) { return (L.seed^(L.day*977+i*131+L.season*7919))>>>0; }
function startDay(L,manage) {
  if(L.phase!=='season'||L.live) return null; const today=L.schedule[L.day], i=today.findIndex(m=>m.includes(DM.you)), [h,a]=today[i];
  const g=newGame(L,h,a,daySeed(L,i),manage?(h===DM.you?1:0):-1); L.live={g,final:false}; return g; }
function finishDay(L) {
  const g=L.live&&L.live.g; if(!g||!g.done||L.live.final) return null; L.live=null;
  L.schedule[L.day].forEach(([h,a],i)=>{ recordGame(L, h===g.home&&a===g.away ? g : playGame(L,h,a,daySeed(L,i),true)); });
  L.lastBox=boxScore(L,g);
  const gate=g.home===DM.you?gateMoney(L):null; if(gate)L.cash+=gate.money;
  L.results.push({day:L.day+1, home:g.home, away:g.away, score:g.score, won:g.winner===DM.you, gate}); L.day++;
  if(L.day%5===0&&!L.offer) L.offer=aiOffer(L);
  if(L.day>=DM.seasonGames) startFinal(L);
  return g;
}
function playDay(L) { const g=startDay(L,false); if(!g) return null; finishGame(L,g); return finishDay(L); }
function standings(L) { return L.clubs.map((c,i)=>({i,c})).sort((a,b)=>(b.c.w-a.c.w)||((b.c.rs-b.c.ra)-(a.c.rs-a.c.ra))||a.i-b.i); }
function startFinal(L) { const s=standings(L); L.phase='final'; L.final={teams:[s[0].i,s[1].i],wins:[0,0],games:[]}; }
/* Best of three; the first-placed club is at home in games one and three. */
function startFinalGame(L,manage) {
  const f=L.final; if(L.phase!=='final'||L.live) return null; const n=f.games.length, top=f.teams[0], other=f.teams[1];
  const [h,a]=n===1?[other,top]:[top,other], g=newGame(L,h,a,(L.seed^(L.season*31337+n*101))>>>0,manage&&f.teams.includes(DM.you)?(h===DM.you?1:0):-1);
  L.live={g,final:true}; return g; }
function finishFinalGame(L) {
  const g=L.live&&L.live.g, f=L.final; if(!g||!g.done||!L.live.final) return null; L.live=null; const top=f.teams[0], other=f.teams[1];
  f.wins[g.winner===top?0:1]++; f.games.push({home:g.home,away:g.away,score:g.score,winner:g.winner}); L.lastBox=boxScore(L,g);
  if(g.home===DM.you){ const gate=gateMoney(L); L.cash+=gate.money*2; }
  if(f.wins[0]===2||f.wins[1]===2){ f.champion=f.wins[0]===2?top:other; L.phase='offseason'; endSeason(L); }
  return g;
}
function playFinalGame(L) { const g=startFinalGame(L,false); if(!g) return null; finishGame(L,g); return finishFinalGame(L); }
/* The offseason: owner's budget, aging, contracts, free agents. */
function endSeason(L) {
  const you=L.clubs[DM.you], champ=L.final.champion===DM.you, inFinal=L.final.teams.includes(DM.you);
  L.history.push({season:L.season, w:you.w, l:you.l, place:standings(L).findIndex(s=>s.i===DM.you)+1, final:inFinal, champion:champ, championName:L.clubs[L.final.champion].name});
  const prev=L.history.length>1?L.history[L.history.length-2].w:null;
  // A climbing club earns a little too, so a GM who improves a losing team sees the budget grow (playtest DM2).
  const raise=champ?1500:inFinal?900:you.w>you.l?600:prev!==null&&you.w>prev?400:0; you.budget=Math.min(18000,you.budget+raise);
  L.report={raise, grew:[], slipped:[], expiring:[], left:[]};
  L.clubs.forEach((c,ci)=>{
    const tr=ci===DM.you?L.upgrades.training*2:1, daily=new Set(c.players.filter(p=>playsDaily(c,p)));
    for(const p of c.players.concat(c.farm||[])){ const before=overall(p), farm=(c.farm||[]).includes(p); develop(L,p,tr,farm||daily.has(p)); const d=overall(p)-before;
      if(ci===DM.you){ if(d>=2)L.report.grew.push({name:p.name,d,farm}); if(d<=-2)L.report.slipped.push({name:p.name,d}); }
      if(p.season&&p.season.g){ p.last=Object.assign({year:L.season},p.season); p.career=p.career||{}; for(const k in p.season) p.career[k]=(p.career[k]||0)+p.season[k]; }
      if(!farm||p.sent)p.years--; if(farm&&p.sent&&p.years<=0){p.sent=false;p.salary=150;p.years=3;} p.season=null; }
    // The farm club is for players 25 and under; older ones leave for free agency.
    c.farm=(c.farm||[]).filter(p=>{ if(p.age<=25)return true; p.prospect=false; p.sent=false; p.salary=askSalary(p); p.years=ri(L,1,2); L.freeAgents.push(p); if(ci===DM.you)L.report.left.push(p.name); return false; });
    if(ci!==DM.you){ // Other clubs call up farm players who are ready.
      for(const p of c.farm.slice().sort((a,b)=>overall(b)-overall(a))) if(overall(p)>=52&&c.players.length<DM.rosterMax){ c.farm.splice(c.farm.indexOf(p),1); p.prospect=false; c.players.push(p); } }
    if(ci!==DM.you){ // Other clubs keep players worth their price and let the rest go.
      c.players=c.players.filter(p=>{ if(p.years>0)return true; if(p.age<36&&overall(p)>=48){p.salary=askSalary(p);p.years=ri(L,1,3);p.bargain=false;return true;} if(p.age<36){p.bargain=false;p.salary=askSalary(p);p.years=ri(L,1,2);L.freeAgents.push(p);} return false; });
    } else L.report.expiring=c.players.filter(p=>p.years<=0).map(p=>p.id);
  });
  fillFreeAgents(L, 8);
  L.clubs.forEach((c,ci)=>{ if(ci!==DM.you){ refill(L,c); fitPayroll(L,c); } setLineup(c); });
  L.freeAgents=L.freeAgents.filter(p=>!p.star); addStandouts(L); ensureBargains(L);
  startDraft(L);
}
/* The draft: each winter 24 young prospects, three rounds, the club with the worst record picks first in every round.
   Other clubs pick the best ceiling their scouts see; the Lanterns choose for themselves (or let Iona). */
const FARM_MAX=6;
function startDraft(L) {
  const order=standings(L).map(s=>s.i).reverse(), pool=[]; for(let i=0;i<24;i++) pool.push(makeProspect(L,L.nextId++));
  L.draft={pool, order:order.concat(order,order), pick:0, picks:[], done:false}; runDraft(L);
}
function draftTo(L,ci,p) { const c=L.clubs[ci], d=L.draft; d.pool.splice(d.pool.indexOf(p),1); c.farm=c.farm||[]; c.farm.push(p);
  if(ci!==DM.you&&c.farm.length>FARM_MAX){ c.farm.sort((a,b)=>b.pot-a.pot); c.farm.length=FARM_MAX; }
  d.picks.push({club:ci,id:p.id,name:p.name,round:Math.floor(d.pick/6)+1}); d.pick++; }
function runDraft(L) { const d=L.draft; if(!d||d.done) return;
  while(d.pick<d.order.length&&d.order[d.pick]!==DM.you){ const best=d.pool.slice().sort((a,b)=>(b.pot+(b.id%7)-3)-(a.pot+(a.id%7)-3))[0]; draftTo(L,d.order[d.pick],best); }
  if(d.pick>=d.order.length) d.done=true; }
function draftPick(L,id) { const d=L.draft; if(!d||d.done) return 'The draft is over.'; if(d.order[d.pick]!==DM.you) return 'It is not our pick.';
  const p=d.pool.find(x=>x.id===id); if(!p) return 'That prospect is gone.';
  if((L.clubs[DM.you].farm||[]).length>=FARM_MAX) return 'The farm club is full ('+FARM_MAX+'). Call someone up or let one go first, or pass.';
  draftTo(L,DM.you,p); runDraft(L); return ''; }
function draftPass(L) { const d=L.draft; if(!d||d.done||d.order[d.pick]!==DM.you) return 'It is not our pick.'; d.picks.push({club:DM.you,id:0,name:'(passed)',round:Math.floor(d.pick/6)+1}); d.pick++; runDraft(L); return ''; }
/* Iona picks the highest ceiling the club's scouts can see, and passes when the farm club is full. */
function draftAuto(L) { const d=L.draft; let g=0; while(d&&!d.done&&g++<10){ if((L.clubs[DM.you].farm||[]).length>=FARM_MAX){draftPass(L);continue;}
  const best=d.pool.slice().sort((a,b)=>scoutCeiling(L,b)-scoutCeiling(L,a)||overall(b)-overall(a))[0]; draftPick(L,best.id); } return ''; }
function callUp(L,id) { const c=L.clubs[DM.you], p=(c.farm||[]).find(x=>x.id===id); if(!p) return 'That player is not on the farm club.';
  if(c.players.length>=DM.rosterMax) return 'The roster is full ('+DM.rosterMax+'). Let someone go or send someone down first.';
  if(!p.sent&&payroll(c)+p.salary>c.budget) return 'The rookie salary would put the payroll over budget.';
  c.farm.splice(c.farm.indexOf(p),1); p.prospect=false; p.sent=false; c.players.push(p); setLineup(c); return ''; }
function sendDown(L,id) { const c=L.clubs[DM.you], p=c.players.find(x=>x.id===id); if(!p) return 'Nobody by that name.';
  if(p.age>25) return 'Only players 25 and under can go to the farm club.'; if((c.farm||[]).length>=FARM_MAX) return 'The farm club is full ('+FARM_MAX+').';
  if(!p.pitcher&&batters(c).length<=DM.minBatters) return 'You need at least nine batters on the roster.'; if(p.pitcher&&pitchers(c).length<=DM.minPitchers) return 'You need at least five pitchers on the roster.';
  c.players.splice(c.players.indexOf(p),1); c.farm=c.farm||[]; c.farm.push(p); p.prospect=true; p.sent=true; setLineup(c); return ''; }
function releaseFarm(L,id) { const c=L.clubs[DM.you], i=(c.farm||[]).findIndex(x=>x.id===id); if(i<0) return 'That player is not on the farm club.'; c.farm.splice(i,1); return ''; }
/* Growth: young players climb toward their potential, faster when they play every day (in the lineup, in the top five
   arms, or on the farm club) and with training rooms; past 30 they slip. Training also lifts a young ceiling a little. */
function develop(L,p,training,playing) {
  const o=overall(p), room=Math.max(0,(p.pot||o)-o); let base;
  if(p.age<=27){ base=Math.min(room+1, ri(L,0,2)+Math.ceil(room/6)+(playing&&p.age<=25&&room>0?1:0)) + (room>0?training:0); p.pot=Math.min(92,(p.pot||o)+Math.ceil(training/2)); }
  else base=p.age<=30?ri(L,-1,1):p.age<=33?ri(L,-3,0):ri(L,-5,-1);
  const keys=p.pitcher?['stuff','control','stamina']:['contact','power','eye','glove'];
  for(const k of keys) p[k]=clamp(p[k]+base+ri(L,-1,1),20,99);
  for(let g=0;g<20&&p.age<=27&&overall(p)>p.pot+1;g++) for(const k of keys) p[k]=clamp(p[k]-1,20,99);
  if(p.age>27) p.pot=Math.max(overall(p),Math.min(p.pot||0,overall(p)+2));
  p.age++;
}
function playsDaily(c,p) { return p.pitcher ? pitchers(c).sort((a,b)=>overall(b)-overall(a)).slice(0,5).includes(p) : c.lineup.includes(p.id); }
function fillFreeAgents(L,n) {
  const lvl=50+L.upgrades.scouting*3;
  while(L.freeAgents.length<n){ const pitcher=rnd(L)<.4; const p=makePlayer(L,L.nextId++,lvl,pitcher,DM.batPos[ri(L,0,8)]); p.salary=askSalary(p); p.years=ri(L,1,3); L.freeAgents.push(p); }
  L.freeAgents.sort((a,b)=>overall(b)-overall(a)); L.freeAgents=L.freeAgents.slice(0,12);
  ensureBargains(L);
}
/* Bargains: two cheap batters and two cheap pitchers are always available, so any roster can be filled. */
function ensureBargains(L) {
  for(const pitcher of [false,true]) while(L.freeAgents.filter(p=>p.bargain&&p.pitcher===pitcher).length<2){
    const p=makePlayer(L,L.nextId++,44,pitcher,DM.batPos[ri(L,0,8)]); p.salary=220; p.years=1; p.bargain=true; L.freeAgents.push(p); }
}
/* Each winter (and the first spring) two standouts reach the market: clearly better than a typical player and
   asking real money. Signing one is the general manager's biggest single lever (playtest DM2, ticket DM-B). */
function addStandouts(L) {
  for(const pitcher of [false,true]){ const p=makePlayer(L,L.nextId++,62+L.upgrades.scouting*2,pitcher,DM.batPos[ri(L,0,8)]);
    p.age=ri(L,24,29); p.salary=askSalary(p); p.years=ri(L,2,3); p.star=true; L.freeAgents.unshift(p); }
}
function refill(L,c) {
  const need=()=>batters(c).length<DM.minBatters?'b':pitchers(c).length<DM.minPitchers?'p':null; let guard=0;
  while(need()&&guard++<20){ const want=need(); let i=L.freeAgents.findIndex(p=>want==='p'?p.pitcher:!p.pitcher);
    if(i<0){ L.freeAgents.push(makePlayer(L,L.nextId++,50,want==='p',DM.batPos[ri(L,0,8)])); i=L.freeAgents.length-1; }
    c.players.push(L.freeAgents.splice(i,1)[0]); }
}
/* The next season starts once every expiring contract has an answer. */
function canStartSeason(L) { return L.phase==='offseason' && (!L.draft||L.draft.done) && L.clubs[DM.you].players.every(p=>p.years>0) && rosterOk(L.clubs[DM.you]) && payroll(L.clubs[DM.you])<=L.clubs[DM.you].budget; }
function startSeason(L) {
  if(!canStartSeason(L)) return false;
  L.season++; L.day=0; L.results=[]; L.final=null; L.phase='season'; L.report=null; L.offer=null; L.draft=null;
  L.clubs.forEach(c=>{c.w=0;c.l=0;c.rs=0;c.ra=0;c.rot=0;});
  return true;
}
function rosterOk(c) { return batters(c).length>=DM.minBatters && pitchers(c).length>=DM.minPitchers && c.players.length<=DM.rosterMax; }

/* Contracts and free agents. Every function returns '' on success or a sentence saying why not. */
function resign(L,id) {
  const c=L.clubs[DM.you], p=c.players.find(x=>x.id===id); if(!p||p.years>0) return 'That contract is not ending.';
  const ask=askSalary(p,L.upgrades.clubhouse); if(payroll(c)-(p.bargain?0:p.salary)+ask>c.budget) return p.name+' asks '+money(ask)+' a season; that would put the payroll over the owner\'s budget.';
  p.salary=ask; p.years=p.age>=32?1:2; p.bargain=false; return '';
}
function release(L,id) {
  const c=L.clubs[DM.you], p=c.players.find(x=>x.id===id); if(!p) return 'Nobody by that name.';
  const after=c.players.filter(x=>x!==p);
  // An ending contract can always be let go (the season won't start until the roster is legal again), so a tight
  // budget never leaves the general manager stuck with a player they can neither keep nor release (DM-B).
  if(p.years>0&&!p.pitcher&&batters(c).length<=DM.minBatters) return 'You need at least nine batters. Sign one first.';
  if(p.years>0&&p.pitcher&&pitchers(c).length<=DM.minPitchers) return 'You need at least five pitchers. Sign one first.';
  // Letting someone go mid-contract costs half of one season's salary; an expiring contract costs nothing.
  const cost=p.years>0?Math.round(p.salary/2):0; if(cost>L.cash) return 'Letting '+p.name+' go costs '+money(cost)+' and the club has '+money(L.cash)+'.';
  L.cash-=cost; c.players=after; if(p.age<36){p.salary=askSalary(p);p.years=ri(L,1,2);p.bargain=false;L.freeAgents.push(p);} setLineup(c); return '';
}
function signFree(L,id) {
  const c=L.clubs[DM.you], i=L.freeAgents.findIndex(x=>x.id===id); if(i<0) return 'That player has signed elsewhere.';
  const p=L.freeAgents[i]; if(c.players.length>=DM.rosterMax) return 'The roster is full ('+DM.rosterMax+'). Let someone go first.';
  if(!p.bargain&&payroll(c)+p.salary>c.budget) return p.name+' wants '+money(p.salary)+' a season; that would put the payroll over the owner\'s budget of '+money(c.budget)+'.';
  L.freeAgents.splice(i,1); c.players.push(p); if(p.bargain)ensureBargains(L); setLineup(c); return '';
}
function buyUpgrade(L,k) {
  const u=DM.upgrades[k], lv=L.upgrades[k]; if(!u) return 'Unknown upgrade.'; if(lv>=u.cost.length) return 'Already as good as it gets.';
  if(L.cash<u.cost[lv]) return 'That costs '+money(u.cost[lv])+'; the club has '+money(L.cash)+'.';
  L.cash-=u.cost[lv]; L.upgrades[k]++; if(k==='scouting')fillFreeAgents(L,L.freeAgents.length); return '';
}

/* Trades. A player's worth to another club: quality (for a young player, partly the ceiling too), youth, and how fair
   the salary is. Farm club prospects can be traded; they join the other club's farm club. */
function tradeRating(p) { const o=overall(p); return p.age<=27&&(p.pot||o)>o ? o+((p.pot||o)-o)*.5 : o; }
function worth(p) { const o=tradeRating(p), age=p.age<=26?1.2:p.age<=30?1:p.age<=33?.75:.5; return Math.max(5,Math.round(Math.pow(Math.max(0,o-38),1.6)*age - (p.prospect&&!p.sent?0:(p.salary-askSalary(p))/40))); }
function clubPlayer(c,id) { return c.players.find(p=>p.id===id)||(c.farm||[]).find(p=>p.id===id); }
function afterTrade(c,out,inn) { const farmIn=inn.filter(p=>p.prospect), rosterIn=inn.filter(p=>!p.prospect);
  return {players:c.players.filter(p=>!out.includes(p)).concat(rosterIn), farm:(c.farm||[]).filter(p=>!out.includes(p)).concat(farmIn)}; }
function judgeTrade(L,other,give,get) {
  const you=L.clubs[DM.you], them=L.clubs[other]; if(!them||other===DM.you) return {ok:false,why:'Pick a club to trade with.'};
  const gp=give.map(id=>clubPlayer(you,id)).filter(Boolean), tp=get.map(id=>clubPlayer(them,id)).filter(Boolean);
  if(!gp.length||!tp.length) return {ok:false,why:'Choose at least one player from each side.'};
  if(gp.length!==give.length||tp.length!==get.length) return {ok:false,why:'Some of those players are no longer with those clubs.'};
  const ya=afterTrade(you,gp,tp), ta=afterTrade(them,tp,gp);
  if(!rosterOk(ya)) return {ok:false,why:'After this trade your roster would not have nine batters and five pitchers (or would pass '+DM.rosterMax+' players).'};
  if(!rosterOk(ta)) return {ok:false,why:them.short+' would be left without nine batters and five pitchers.'};
  if(ya.farm.length>FARM_MAX) return {ok:false,why:'Our farm club would have more than '+FARM_MAX+' players.'};
  if(ta.farm.length>FARM_MAX) return {ok:false,why:them.short+' have no room on their farm club.'};
  if(payroll(ya)>you.budget) return {ok:false,why:'Your payroll would go over the owner\'s budget of '+money(you.budget)+'.'};
  if(payroll(ta)>them.budget+500) return {ok:false,why:them.short+' can\'t take on that much salary.'};
  const g=gp.reduce((n,p)=>n+worth(p),0), t=tp.reduce((n,p)=>n+worth(p),0);
  if(g>=t*1.05) return {ok:true,why:them.short+'\' general manager shakes your hand: "Deal."',give:g,get:t};
  const gap=t*1.05-g, more=gap<t*.15?'a little more':gap<t*.5?'a fair bit more':'much more';
  return {ok:false,why:'"Not quite. We would need '+more+' for that." ('+them.short+' value what you offer at '+g+' and what you ask for at '+t+'.)',give:g,get:t};
}
function doTrade(L,other,give,get) {
  const j=judgeTrade(L,other,give,get); if(!j.ok) return j.why;
  const you=L.clubs[DM.you], them=L.clubs[other];
  const gp=give.map(id=>clubPlayer(you,id)), tp=get.map(id=>clubPlayer(them,id));
  const ya=afterTrade(you,gp,tp), ta=afterTrade(them,tp,gp);
  you.players=ya.players; you.farm=ya.farm; them.players=ta.players; them.farm=ta.farm;
  setLineup(you); setLineup(them); L.log.push('Season '+L.season+', day '+L.day+': traded '+gp.map(p=>p.name).join(', ')+' to '+them.short+' for '+tp.map(p=>p.name).join(', ')+'.');
  return '';
}
/* The trade finder. completeDeal adds the least valuable one or two of our players (roster or farm) that turn a
   proposal into one the other club accepts, or returns null. findDeal asks it for a player we want. shopPlayer asks
   every club for the best player they would give for one of ours. */
function completeDeal(L,other,give,get) {
  const you=L.clubs[DM.you]; if(give.length&&judgeTrade(L,other,give,get).ok) return give.slice();
  const pool=you.players.concat(you.farm||[]).filter(p=>!give.includes(p.id)).sort((a,b)=>worth(a)-worth(b));
  let best=null, bestW=Infinity;
  for(const a of pool){ const w=worth(a); if(w>=bestW) break; const ids=give.concat(a.id); if(judgeTrade(L,other,ids,get).ok){ best=ids; bestW=w; break; } }
  for(let i=0;i<pool.length;i++) for(let k=i+1;k<pool.length;k++){ const w=worth(pool[i])+worth(pool[k]); if(w>=bestW) break;
    const ids=give.concat(pool[i].id,pool[k].id); if(judgeTrade(L,other,ids,get).ok){ best=ids; bestW=w; } }
  return best;
}
function findDeal(L,other,targetId) { return completeDeal(L,other,[],[targetId]); }
function shopPlayer(L,id) { const out=[];
  L.clubs.forEach((c,ci)=>{ if(ci===DM.you) return;
    const best=c.players.concat(c.farm||[]).slice().sort((a,b)=>worth(b)-worth(a)).find(p=>judgeTrade(L,ci,[id],[p.id]).ok);
    if(best) out.push({club:ci,get:best.id}); });
  return out.sort((a,b)=>worth(clubPlayer(L.clubs[b.club],b.get))-worth(clubPlayer(L.clubs[a.club],a.get))); }
/* Every fifth day another club may call with an offer that slightly favours them. */
function aiOffer(L) {
  const you=L.clubs[DM.you], mine=you.players.slice().sort((a,b)=>worth(b)-worth(a)).slice(0,10);
  for(let tries=0;tries<6;tries++){
    const other=1+Math.floor(rnd(L)*5), them=L.clubs[other], want=mine[Math.floor(rnd(L)*mine.length)];
    const theirs=them.players.filter(p=>p.pitcher===want.pitcher&&worth(p)<=worth(want)/1.06&&worth(p)>=worth(want)*.7).sort((a,b)=>worth(b)-worth(a))[0];
    if(theirs&&judgeTrade(L,other,[want.id],[theirs.id]).ok) return {club:other, give:want.id, get:theirs.id};
  }
  return null;
}
function answerOffer(L,yes) { const o=L.offer; L.offer=null; if(!o||!yes) return ''; return doTrade(L,o.club,[o.give],[o.get]); }

function validLeague(o) {
  // Imported JSON must be playable, not merely have the right game label.
  try {
    const number = n => Number.isFinite(n), int = n => Number.isInteger(n), team = n => int(n) && n >= 0 && n < 6;
    if (!o || o.game !== 'diamond-manager' || o.schema !== 1 || !int(o.seed) || !int(o.nextId) || !int(o.season) || o.season < 1 ||
        !number(o.cash) || o.cash < 0 || !['season','final','offseason'].includes(o.phase) || !int(o.day) || o.day < 0 ||
        o.day > DM.seasonGames || (o.phase === 'season' && o.day === DM.seasonGames)) return false;
    if (!Array.isArray(o.clubs) || o.clubs.length !== 6 || !Array.isArray(o.freeAgents) || !Array.isArray(o.results) ||
        !Array.isArray(o.schedule) || o.schedule.length !== DM.seasonGames || !o.upgrades) return false;
    if (!Object.entries(DM.upgrades).every(([key,u]) => int(o.upgrades[key]) && o.upgrades[key] >= 0 && o.upgrades[key] <= u.cost.length)) return false;
    if (o.speed !== undefined && ![1,2,3].includes(o.speed)) return false;
    const ids = new Set();
    const player = p => {
      if (!p || !int(p.id) || p.id < 1 || ids.has(p.id) || typeof p.name !== 'string' || typeof p.pitcher !== 'boolean' ||
          !int(p.age) || p.age < 1 || !number(p.salary) || p.salary < 0 || !int(p.years) || (p.pot !== undefined && !number(p.pot))) return false;
      ids.add(p.id);
      return (p.pitcher ? ['stuff','control','stamina'] : ['contact','power','eye','glove']).every(k => number(p[k]) && p[k] >= 0 && p[k] <= 99);
    };
    for (const c of o.clubs) {
      if (!c || typeof c.name !== 'string' || typeof c.short !== 'string' || !number(c.budget) || !int(c.rot) || c.rot < 0 ||
          !['w','l','rs','ra'].every(k => number(c[k]) && c[k] >= 0) || !Array.isArray(c.players) || !c.players.every(player) || !rosterOk(c)) return false;
      if (c.farm !== undefined && (!Array.isArray(c.farm) || c.farm.length > 8 || !c.farm.every(player))) return false;
      if (!Array.isArray(c.lineup) || c.lineup.length !== 9 || new Set(c.lineup).size !== 9 || !c.lineup.every(id => c.players.some(p => p.id === id && !p.pitcher))) return false;
    }
    if (o.draft && (!Array.isArray(o.draft.pool) || !o.draft.pool.every(player) || !Array.isArray(o.draft.order) || !o.draft.order.every(team) || !int(o.draft.pick) || o.draft.pick < 0 || o.draft.pick > o.draft.order.length || !Array.isArray(o.draft.picks))) return false;
    if (!o.freeAgents.every(player) || [...ids].some(id => id >= o.nextId)) return false;
    if (!o.schedule.every(day => Array.isArray(day) && day.length === 3 && day.every(pair => Array.isArray(pair) && pair.length === 2 && pair.every(team) && pair[0] !== pair[1]) && new Set(day.flat()).size === 6)) return false;
    if (o.phase !== 'season') {
      const f = o.final;
      if (!f || !Array.isArray(f.teams) || f.teams.length !== 2 || !f.teams.every(team) || f.teams[0] === f.teams[1] ||
          !Array.isArray(f.wins) || f.wins.length !== 2 || !f.wins.every(n => int(n) && n >= 0 && n <= 2) || !Array.isArray(f.games)) return false;
      if (o.phase === 'offseason' && (!team(f.champion) || !f.teams.includes(f.champion))) return false;
    }
    if (o.offer && (!team(o.offer.club) || o.offer.club === DM.you)) return false;
    if (o.live) { const g = o.live.g, has = (side, id) => o.clubs[side ? g.home : g.away].players.some(p => p.id === id);
      if (!g || !team(g.home) || !team(g.away) || g.home === g.away || !Array.isArray(g.lineup) || !g.lineup.every((l, side) => Array.isArray(l) && l.length === 9 && l.every(id => has(side, id))) ||
          !Array.isArray(g.pitcher) || !g.pitcher.every((id, side) => has(side, id)) || !Array.isArray(g.bases) || g.bases.length !== 3 || !Array.isArray(g.events) ||
          !int(g.inning) || g.inning < 1 || g.inning > 15 || ![0,1].includes(g.half) || !Array.isArray(g.score) || !g.box || !g.pbox) return false; }
    if (o.report && (!Array.isArray(o.history) || !o.history.length || !['grew','slipped','expiring'].every(k => Array.isArray(o.report[k])))) return false;
    return true;
  } catch (_) { return false; }
}
/* Recover structurally damaged JSON as well as truncated JSON. Preserve the original before any new save. */
function loadLeague(storage, backups) {
  let raw;
  try { raw = storage.getItem(DM.key); } catch (_) { return null; } // private/blocked storage still permits a new visit
  if (raw) {
    try { const parsed = JSON.parse(raw); if (validLeague(parsed)) return parsed; } catch (_) {}
    try { storage.setItem('arcade-backup:' + DM.key + ':rejected-' + Date.now(), JSON.stringify({at:Date.now(),why:'Unreadable league preserved before recovery',data:raw,ver:'0.1.0'})); }
    catch (_) { throw Error('The damaged league could not be backed up. Free some browser storage before continuing.'); }
  }
  for (const b of backups) { try { const parsed = JSON.parse(b.data); if (validLeague(parsed)) return parsed; } catch (_) {} }
  return null;
}
function migrateLeague(o) { if(!validLeague(o)) return newLeague((Date.now()>>>0)||1); const L=Object.assign({speed:1,intro:false,log:[],history:[],inbox:[],sound:0},o);
  // DM-B (v0.2.0): the owner found $3M more for the Lanterns, and the market gained standouts and league-minimum players.
  if(!L.dmb){ L.dmb=true; L.clubs[DM.you].budget=Math.min(18000,L.clubs[DM.you].budget+3000); if(!L.freeAgents.some(p=>p.star))addStandouts(L); ensureBargains(L); }
  // Draft and development (v0.3.0): everyone gets a ceiling, every club a farm club.
  if(!L.dmc){ L.dmc=true; const r={seed:(L.seed^0x5eed)>>>0}; for(const c of L.clubs){ for(const p of c.players)if(p.pot===undefined)p.pot=potentialFor(r,p); c.farm=c.farm||[]; }
    for(const p of L.freeAgents)if(p.pot===undefined)p.pot=potentialFor(r,p); if(L.phase==='offseason'&&!L.draft)L.draft={pool:[],order:[],pick:0,picks:[],done:true}; }
  // The game, pitch by pitch (v0.5.0): batters get a speed rating.
  if(!L.dmd){ L.dmd=true; const all=L.clubs.flatMap(c=>c.players.concat(c.farm||[])).concat(L.freeAgents,L.draft?L.draft.pool:[]); for(const p of all) if(!p.pitcher&&p.speed===undefined) p.speed=speedFor(p.id,p.age); }
  if(L.lastBox&&!(Array.isArray(L.lastBox.bat)&&Array.isArray(L.lastBox.pit))) delete L.lastBox;
  return L; }
