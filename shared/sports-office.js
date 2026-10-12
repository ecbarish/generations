'use strict';
/* The sports front office, shared by every sport in the arcade (LB1, 2026-10-11): the seeded dice, money words,
   salaries, payroll, the schedule and standings, contracts and free agents, facility upgrades, trades and the trade
   finder, and loading a save. Written once so Diamond Manager, Lantern Bowl and later sports improve together.
   Each game defines a global SPORT before any of this runs, with what only that sport knows:
     cfg          its settings object (you, rosterMax, upgrades, words, key)
     overall(p)   one number for a player's quality
     rosterOk(c)  whether a club's players make a legal roster; rosterNeed says what that means in words
     lineup(c)    re-sets a club's lineup or depth chart after players come and go
     sameRole(a,b) whether two players fill the same kind of job (for the other clubs' trade offers)
     cantLose(c,p) a sentence if letting p go mid-contract would leave the roster short, else ''
     signed(L,p), upgraded(L,k)  the sport's own follow-ups after a signing or an upgrade
     farmMax      how many prospects a farm club holds
     valid(o)     whether a parsed save is a sound league
   Money is in thousands of dollars (game currency): 1500 means $1.5M. */
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const copy = o => JSON.parse(JSON.stringify(o));
function rnd(r) { r.seed = (Math.imul(r.seed >>> 0,1664525) + 1013904223) >>> 0; return r.seed / 4294967296; }
function ri(r,a,b) { return a + Math.floor(rnd(r)*(b-a+1)); }
function money(k) { const a=Math.abs(k), s=k<0?'-':''; return a>=1000 ? s+'$'+(a/1000).toFixed(a%1000?2:1).replace(/0$/,'')+'M' : s+'$'+a+'K'; }
function word(n) { return SPORT.cfg.words.find(w=>n>=w[0])[1]; }

function askSalary(p, clubhouse=0) {
  const o=SPORT.overall(p), base=250+Math.pow(Math.max(0,o-45),1.8)*6, age=p.age<=24?.9:p.age>=33?.8:1;
  const regular=Math.round(base*age*(1-.05*clubhouse)/10)*10;
  return SPORT.adjustSalary?SPORT.adjustSalary(p,regular):regular;
}

/* AI clubs, and the opening rosters, keep their payroll inside their budget by trimming salaries. */
function fitPayroll(L,club) { let over=payroll(club)-club.budget; if(over<=0)return; const f=club.budget/payroll(club); club.players.forEach(p=>p.salary=Math.max(200,Math.round(p.salary*f/10)*10)); }
// League-minimum players (bargains) don't count against the owner's budget, so a roster can always be filled.
/* Players sent down to the farm club on a big-league contract still draw that salary. */
function payroll(club) { return club.players.concat(club.farm||[]).reduce((n,p)=>n+(p.bargain||(p.prospect&&!p.sent)?0:p.salary),0); }

/* Round robin by the circle method, repeated with home and away swapped. */
function makeSchedule(n) {
  const t=[0,1,2,3,4,5], rounds=[];
  for(let r=0;r<5;r++){ const a=[t[0]].concat(t.slice(1).map((_,i)=>t[1+((i+r)%5)])); const day=[]; for(let i=0;i<3;i++)day.push([a[i],a[5-i]]); rounds.push(day); }
  const s=[]; for(let d=0;d<n;d++){ const day=rounds[d%5]; s.push(day.map(([h,a])=>Math.floor(d/5)%2?[a,h]:[h,a])); }
  return s;
}

function nth(n){return n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');}

function standings(L) { return L.clubs.map((c,i)=>({i,c})).sort((a,b)=>(b.c.w-a.c.w)||((b.c.rs-b.c.ra)-(a.c.rs-a.c.ra))||a.i-b.i); }

/* Contracts and free agents. Every function returns '' on success or a sentence saying why not. */
function resign(L,id) {
  const c=L.clubs[SPORT.cfg.you], p=c.players.find(x=>x.id===id); if(!p||p.years>0) return 'That contract is not ending.';
  const ask=askSalary(p,L.upgrades.clubhouse); if(payroll(c)-(p.bargain?0:p.salary)+ask>c.budget) return p.name+' asks '+money(ask)+' a season; that would put the payroll over the owner\'s budget.';
  p.salary=ask; p.years=p.age>=32?1:2; p.bargain=false; if(SPORT.renewed)SPORT.renewed(L,p); return '';
}
function release(L,id) {
  const c=L.clubs[SPORT.cfg.you], p=c.players.find(x=>x.id===id); if(!p) return 'Nobody by that name.';
  const after=c.players.filter(x=>x!==p);
  // An ending contract can always be let go (the season won't start until the roster is legal again), so a tight
  // budget never leaves the general manager stuck with a player they can neither keep nor release (DM-B).
  if(p.years>0){ const why=SPORT.cantLose(c,p); if(why) return why; }
  // Letting someone go mid-contract costs half of one season's salary; an expiring contract costs nothing.
  const cost=p.years>0?Math.round(p.salary/2):0; if(cost>L.cash) return 'Letting '+p.name+' go costs '+money(cost)+' and the club has '+money(L.cash)+'.';
  L.cash-=cost; c.players=after; if(p.age<36){p.salary=askSalary(p);p.years=ri(L,1,2);p.bargain=false;L.freeAgents.push(p);} SPORT.lineup(c); return '';
}
function signFree(L,id) {
  const c=L.clubs[SPORT.cfg.you], i=L.freeAgents.findIndex(x=>x.id===id); if(i<0) return 'That player has signed elsewhere.';
  const p=L.freeAgents[i]; if(c.players.length>=SPORT.cfg.rosterMax) return 'The roster is full ('+SPORT.cfg.rosterMax+'). Let someone go first.';
  if(!p.bargain&&payroll(c)+p.salary>c.budget) return p.name+' wants '+money(p.salary)+' a season; that would put the payroll over the owner\'s budget of '+money(c.budget)+'.';
  L.freeAgents.splice(i,1); c.players.push(p); SPORT.signed(L,p); SPORT.lineup(c); return '';
}
function buyUpgrade(L,k) {
  const u=SPORT.cfg.upgrades[k], lv=L.upgrades[k]; if(!u) return 'Unknown upgrade.'; if(lv>=u.cost.length) return 'Already as good as it gets.';
  if(L.cash<u.cost[lv]) return 'That costs '+money(u.cost[lv])+'; the club has '+money(L.cash)+'.';
  L.cash-=u.cost[lv]; L.upgrades[k]++; SPORT.upgraded(L,k); return '';
}

/* Trades. A player's worth to another club: quality (for a young player, partly the ceiling too), youth, and how fair
   the salary is. Farm club prospects can be traded; they join the other club's farm club. */
function tradeRating(p) { const o=SPORT.overall(p); return p.age<=27&&(p.pot||o)>o ? o+((p.pot||o)-o)*.5 : o; }
function worth(p) { const o=tradeRating(p), age=p.age<=26?1.2:p.age<=30?1:p.age<=33?.75:.5; return Math.max(5,Math.round(Math.pow(Math.max(0,o-38),1.6)*age - (p.prospect&&!p.sent?0:(p.salary-askSalary(p))/40))); }
function clubPlayer(c,id) { return c.players.find(p=>p.id===id)||(c.farm||[]).find(p=>p.id===id); }
function afterTrade(c,out,inn) { const farmIn=inn.filter(p=>p.prospect), rosterIn=inn.filter(p=>!p.prospect);
  return {players:c.players.filter(p=>!out.includes(p)).concat(rosterIn), farm:(c.farm||[]).filter(p=>!out.includes(p)).concat(farmIn)}; }
function judgeTrade(L,other,give,get) {
  const you=L.clubs[SPORT.cfg.you], them=L.clubs[other]; if(!them||other===SPORT.cfg.you) return {ok:false,why:'Pick a club to trade with.'};
  const gp=give.map(id=>clubPlayer(you,id)).filter(Boolean), tp=get.map(id=>clubPlayer(them,id)).filter(Boolean);
  if(!gp.length||!tp.length) return {ok:false,why:'Choose at least one player from each side.'};
  if(gp.length!==give.length||tp.length!==get.length) return {ok:false,why:'Some of those players are no longer with those clubs.'};
  const ya=afterTrade(you,gp,tp), ta=afterTrade(them,tp,gp);
  if(!SPORT.rosterOk(ya)) return {ok:false,why:'After this trade your roster would not have '+SPORT.rosterNeed+' (or would pass '+SPORT.cfg.rosterMax+' players).'};
  if(!SPORT.rosterOk(ta)) return {ok:false,why:them.short+' would be left without '+SPORT.rosterNeed+'.'};
  if(ya.farm.length>SPORT.farmMax) return {ok:false,why:'Our farm club would have more than '+SPORT.farmMax+' players.'};
  if(ta.farm.length>SPORT.farmMax) return {ok:false,why:them.short+' have no room on their farm club.'};
  if(payroll(ya)>you.budget) return {ok:false,why:'Your payroll would go over the owner\'s budget of '+money(you.budget)+'.'};
  if(payroll(ta)>them.budget+500) return {ok:false,why:them.short+' can\'t take on that much salary.'};
  const g=gp.reduce((n,p)=>n+worth(p),0), t=tp.reduce((n,p)=>n+worth(p),0);
  if(g>=t*1.05) return {ok:true,why:them.short+'\' general manager shakes your hand: "Deal."',give:g,get:t};
  const gap=t*1.05-g, more=gap<t*.15?'a little more':gap<t*.5?'a fair bit more':'much more';
  return {ok:false,why:'"Not quite. We would need '+more+' for that." ('+them.short+' value what you offer at '+g+' and what you ask for at '+t+'.)',give:g,get:t};
}
function doTrade(L,other,give,get) {
  const j=judgeTrade(L,other,give,get); if(!j.ok) return j.why;
  const you=L.clubs[SPORT.cfg.you], them=L.clubs[other];
  const gp=give.map(id=>clubPlayer(you,id)), tp=get.map(id=>clubPlayer(them,id));
  const ya=afterTrade(you,gp,tp), ta=afterTrade(them,tp,gp);
  you.players=ya.players; you.farm=ya.farm; them.players=ta.players; them.farm=ta.farm;
  SPORT.lineup(you); SPORT.lineup(them); L.log.push('Season '+L.season+', day '+L.day+': traded '+gp.map(p=>p.name).join(', ')+' to '+them.short+' for '+tp.map(p=>p.name).join(', ')+'.');
  if(SPORT.traded)SPORT.traded(L,gp,tp,other);
  return '';
}
/* The trade finder. completeDeal adds the least valuable one or two of our players (roster or farm) that turn a
   proposal into one the other club accepts, or returns null. findDeal asks it for a player we want. shopPlayer asks
   every club for the best player they would give for one of ours. */
function completeDeal(L,other,give,get) {
  const you=L.clubs[SPORT.cfg.you]; if(give.length&&judgeTrade(L,other,give,get).ok) return give.slice();
  const pool=you.players.concat(you.farm||[]).filter(p=>!give.includes(p.id)).sort((a,b)=>worth(a)-worth(b));
  let best=null, bestW=Infinity;
  for(const a of pool){ const w=worth(a); if(w>=bestW) break; const ids=give.concat(a.id); if(judgeTrade(L,other,ids,get).ok){ best=ids; bestW=w; break; } }
  for(let i=0;i<pool.length;i++) for(let k=i+1;k<pool.length;k++){ const w=worth(pool[i])+worth(pool[k]); if(w>=bestW) break;
    const ids=give.concat(pool[i].id,pool[k].id); if(judgeTrade(L,other,ids,get).ok){ best=ids; bestW=w; } }
  return best;
}
function findDeal(L,other,targetId) { return completeDeal(L,other,[],[targetId]); }
function shopPlayer(L,id) { const out=[];
  L.clubs.forEach((c,ci)=>{ if(ci===SPORT.cfg.you) return;
    const best=c.players.concat(c.farm||[]).slice().sort((a,b)=>worth(b)-worth(a)).find(p=>judgeTrade(L,ci,[id],[p.id]).ok);
    if(best) out.push({club:ci,get:best.id}); });
  return out.sort((a,b)=>worth(clubPlayer(L.clubs[b.club],b.get))-worth(clubPlayer(L.clubs[a.club],a.get))); }
/* Every fifth day another club may call with an offer that slightly favours them. */
function aiOffer(L) {
  const you=L.clubs[SPORT.cfg.you], mine=you.players.slice().sort((a,b)=>worth(b)-worth(a)).slice(0,10);
  for(let tries=0;tries<6;tries++){
    const other=1+Math.floor(rnd(L)*5), them=L.clubs[other], want=mine[Math.floor(rnd(L)*mine.length)];
    const theirs=them.players.filter(p=>SPORT.sameRole(p,want)&&worth(p)<=worth(want)/1.06&&worth(p)>=worth(want)*.7).sort((a,b)=>worth(b)-worth(a))[0];
    if(theirs&&judgeTrade(L,other,[want.id],[theirs.id]).ok) return {club:other, give:want.id, get:theirs.id};
  }
  return null;
}
function answerOffer(L,yes) { const o=L.offer; L.offer=null; if(!o||!yes) return ''; return doTrade(L,o.club,[o.give],[o.get]); }

/* Recover structurally damaged JSON as well as truncated JSON. Preserve the original before any new save. */
function loadLeague(storage, backups) {
  let raw;
  try { raw = storage.getItem(SPORT.cfg.key); } catch (_) { return null; } // private/blocked storage still permits a new visit
  if (raw) {
    try { const parsed = JSON.parse(raw); if (SPORT.valid(parsed)) return parsed; } catch (_) {}
    try { storage.setItem('arcade-backup:' + SPORT.cfg.key + ':rejected-' + Date.now(), JSON.stringify({at:Date.now(),why:'Unreadable league preserved before recovery',data:raw,ver:'0.1.0'})); }
    catch (_) { throw Error('The damaged league could not be backed up. Free some browser storage before continuing.'); }
  }
  for (const b of backups) { try { const parsed = JSON.parse(b.data); if (SPORT.valid(parsed)) return parsed; } catch (_) {} }
  return null;
}
