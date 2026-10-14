'use strict';
/* Diamond Manager: one ballgame, pitch by pitch. A game is a plain object (it saves with the league, so a game left
   halfway resumes). stepGame moves it on by one pitch or one play and adds events for the screen to draw and the
   play-by-play to read. Each club is managed by Iona's rules unless it is the side the player manages: then the game
   stops to ask at the big moments (a tired pitcher, a chance to pinch hit or pinch run), and the player can make any
   move between batters. */

const FIELDERS={P:[0,.30],C:[0,-.05],'1B':[33,.47],'2B':[13,.62],SS:[-13,.62],'3B':[-33,.47],LF:[-28,.84],CF:[0,.9],RF:[28,.84]};
const FIELD_WORD={P:'the pitcher',C:'the catcher','1B':'first',  '2B':'second',SS:'short','3B':'third',LF:'left',CF:'center',RF:'right'};
function pitchLimit(g,side,p) { return g.starters[side]===p.id ? 70+Math.round(p.stamina*.5) : 18+Math.round(p.stamina*.25); }
/* Past the limit a pitcher tires: Stuff and Control fall a little with every pitch. */
function effective(g,side,p) { const over=Math.max(0,(g.pbox[p.id]?g.pbox[p.id].pitches:0)-pitchLimit(g,side,p)), cut=Math.min(18,Math.round(over*.4));
  const q=formRatings(p); return {stuff:Math.max(0,q.stuff-cut), control:Math.max(0,q.control-cut), stamina:p.stamina, tired:over>0}; }
function gClub(L,g,side) { return L.clubs[side?g.home:g.away]; }
function gPlayer(L,g,side,id) { return gClub(L,g,side).players.find(p=>p.id===id); }
function lastName(p) { return p.name.split(' ').slice(1).join(' ')||p.name; }

function newGame(L,home,away,seed,manage=-1,quiet=false) {
  const key=dayKey(L), teams=[L.clubs[away],L.clubs[home]], st=teams.map(c=>starterOf(c,key).id);
  const g={home,away,key,formKey:formGameKey(L),seed:seed>>>0,steal:null,manage,quiet,inning:1,half:0,outs:0,balls:0,strikes:0,bases:[0,0,0],score:[0,0],line:[[],[]],hits:[0,0],
    order:[0,0],lineup:teams.map(c=>c.lineup.slice()),first:teams.map(c=>c.lineup.slice()),bat:teams.map(c=>c.lineup.slice()),gone:[[],[]],pitcher:st.slice(),starters:st.slice(),
    used:st.map(id=>[id]),box:{},pbox:{},events:[],pa:null,started:false,done:false,asked:{},ask:null,hold:false,rec:null,winner:null,decision:null};
  st.forEach(id=>g.pbox[id]=pline());
  return g;
}
const bline=()=>({ab:0,r:0,h:0,d:0,t:0,hr:0,rbi:0,bb:0,k:0,sb:0,cs:0});
const pline=()=>({outs:0,h:0,r:0,bb:0,k:0,hr:0,pitches:0,bf:0});
function snap(g,o) { if(g.quiet&&!o.runs&&o.kind!=='end') return; g.events.push(Object.assign({inning:g.inning,half:g.half,outs:g.outs,balls:g.balls,strikes:g.strikes,
  bases:g.bases.map(b=>b?1:0),runners:g.bases.slice(),score:g.score.slice(),pitcher:g.pitcher[1-g.half],batter:g.lineup[g.half][g.order[g.half]]},o)); }

/* Players who can still come in: batters on the bench, and pitchers who haven't pitched today. */
function benchOf(L,g,side) { return batters(gClub(L,g,side)).filter(p=>!g.lineup[side].includes(p.id)&&!g.gone[side].includes(p.id)); }
function bullpenOf(L,g,side) { const c=gClub(L,g,side), rot=pitchers(c).slice().sort((a,b)=>overall(b)-overall(a)).slice(0,5).map(p=>p.id);
  return pitchers(c).filter(p=>!g.used[side].includes(p.id)&&rested(p,g.key)).sort((a,b)=>(rot.includes(a.id)-rot.includes(b.id))||(rot.includes(a.id)?overall(a)-overall(b):overall(b)-overall(a))); }

/* Moves. Each is legal only between batters. They return '' or why not. */
function changePitcher(L,g,side,id) { const p=bullpenOf(L,g,side).find(x=>x.id===id); if(!p) return 'That pitcher is not available.'; if(g.pa) return 'Wait for this batter to finish.';
  const old=gPlayer(L,g,side,g.pitcher[side]); g.pitcher[side]=id; g.used[side].push(id); g.pbox[id]=g.pbox[id]||pline();
  snap(g,{kind:'move',side,t:gClub(L,g,side).short+' change pitchers: '+p.name+' comes in for '+lastName(old)+'.'}); return ''; }
function substitute(L,g,side,outId,inId,how) { const p=benchOf(L,g,side).find(x=>x.id===inId), slot=g.lineup[side].indexOf(outId); if(g.pa) return 'Wait for this batter to finish.';
  if(!p||slot<0) return 'That move is not possible.'; const old=gPlayer(L,g,side,outId);
  g.lineup[side][slot]=inId; g.gone[side].push(outId); g.bat[side].splice(g.bat[side].indexOf(outId)+1,0,inId);
  const b=g.bases.indexOf(outId); if(b>=0&&side===g.half) g.bases[b]=inId;
  snap(g,{kind:'move',side,t:how==='run'?p.name+' runs for '+lastName(old)+' at '+['first','second','third'][b]+'.':how==='field'?p.name+' comes in to play the field for '+lastName(old)+'.':p.name+' bats for '+lastName(old)+'.'}); return ''; }
function defensiveSub(L,g,side,outId,inId) { return side===g.half?'We are batting.':substitute(L,g,side,outId,inId,'field'); }
/* Send a runner: he goes on the first pitch to the next batter. */
function stealChance(L,g,side,base) {
  if(g.done||![0,1].includes(side)||side!==g.half||![0,1].includes(base)||!g.bases[base]||g.bases[base+1]||g.outs>=3)return null;
  const r=gPlayer(L,g,side,g.bases[base]),field=g.lineup[1-side].map(id=>gPlayer(L,g,1-side,id)),cat=field.find(p=>p.pos==='C')||field[0];
  return r&&cat?clamp(.62+(spd(r)-50)*.01-(cat.glove-50)*.005,.35,.92):null;
}
function sendRunner(L,g,side,base) { if(side!==g.half||g.pa) return 'Only between batters, while we bat.'; if(stealChance(L,g,side,base)===null) return 'No runner can steal there.'; g.steal={side,base}; return ''; }
function pinchHit(L,g,side,inId) { return side!==g.half?'We are not batting.':substitute(L,g,side,g.lineup[side][g.order[side]],inId,'hit'); }
function pinchRun(L,g,side,base,inId) { const id=g.bases[base]; return side!==g.half||!id?'There is no runner there.':substitute(L,g,side,id,inId,'run'); }

/* What Iona would do (and does, for every club the player doesn't manage). */
function ionaPitching(L,g,side) { const p=gPlayer(L,g,side,g.pitcher[side]), b=g.pbox[p.id], pen=bullpenOf(L,g,side); if(!pen.length) return null;
  const lead=g.score[side]-g.score[1-side], best=pen[0];
  if(b.pitches>pitchLimit(g,side,p)+4) return {kind:'tired',side,id:best.id};
  if(b.r>=6&&b.outs<15) return {kind:'shelled',side,id:best.id};
  if(g.inning>=8&&lead>=1&&lead<=3&&!g.asked['def:'+side+':'+g.inning]){ const bench=benchOf(L,g,side), fielders=g.lineup[side].map(id=>gPlayer(L,g,side,id)).sort((a,b)=>a.glove-b.glove), glove=bench.slice().sort((a,b)=>b.glove-a.glove)[0];
    if(glove&&fielders[0]&&glove.glove>=fielders[0].glove+12) return {kind:'def',side,id:glove.id,out:fielders[0].id}; }
  if(g.inning>=9&&lead>=1&&lead<=3&&g.starters[side]===p.id&&b.pitches>pitchLimit(g,side,p)-25&&overall(best)>=overall(p)-6) return {kind:'close',side,id:best.id};
  return null; }
function ionaBatting(L,g,side) { const diff=g.score[side]-g.score[1-side]; if(g.inning<7||diff<-3||diff>2) return null; const bench=benchOf(L,g,side); if(!bench.length) return null;
  const up=gPlayer(L,g,side,g.lineup[side][g.order[side]]), bat=bench.slice().sort((a,b)=>hitting(b)-hitting(a))[0];
  if(hitting(bat)>=hitting(up)+6&&(g.bases.some(Boolean)||g.inning>=8)) return {kind:'ph',side,id:bat.id,out:up.id};
  if(g.inning>=8&&diff<=1&&diff>=-2){ for(const base of [2,1]){ const id=g.bases[base]; if(!id) continue; const r=gPlayer(L,g,side,id), fast=bench.slice().sort((a,b)=>spd(b)-spd(a))[0];
    if(fast&&fast.id!==bat.id&&spd(fast)>=spd(r)+15) return {kind:'pr',side,id:fast.id,out:id,base}; } }
  return null; }
const hitting=p=>(p.contact*2+p.power+p.eye)/4, spd=p=>p.speed||50;
/* A close early-game call, offered only to the human manager. Declining uses no roll.
   One offer per inning keeps it a decision, not an interruption at every batter. */
function ionaSteal(L,g,side) {
  if(g.manage!==side||g.half!==side||g.pa||g.steal||g.outs>=2||Math.abs(g.score[side]-g.score[1-side])>3)return null;
  const key='steal-call:'+side+':'+g.inning;if(g.asked[key])return null;
  for(const base of [1,0]){const chance=stealChance(L,g,side,base);if(chance!==null&&chance>=.6)return {kind:'steal',side,base,out:g.bases[base],key};}
  return null;
}
function applyIdea(L,g,m) { if(m.kind==='def'){ g.asked['def:'+m.side+':'+g.inning]=true; return defensiveSub(L,g,m.side,m.out,m.id); } if(m.kind==='steal') return sendRunner(L,g,m.side,m.base); return m.kind==='ph'?pinchHit(L,g,m.side,m.id):m.kind==='pr'?pinchRun(L,g,m.side,m.base,m.id):changePitcher(L,g,m.side,m.id); }
/* The player's answer to a question the game stopped for. */
function answerAsk(L,g,yes) { const a=g.ask; g.ask=null; if(!a) return ''; g.asked[a.key]=true; return yes?applyIdea(L,g,a):''; }

/* Which pitches lead to a result: four balls for a walk, three strikes for a strikeout, and a count before the ball
   is put in play. Results come first (from the ratings), so the numbers stay those of the tested simulation. */
function pitchesFor(g,res) { const seq=[], shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd(g)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const strike=()=>{const x=rnd(g);return x<.4?'S':x<.75?'W':'F';};
  let b, s, last;
  const pk=a=>a[Math.floor(rnd(g)*a.length)];
  if(res==='walk'){ b=3; s=pk([0,0,1,1,2]); last='B'; } else if(res==='k'){ b=pk([0,0,1,1,1,2,3]); s=2; last=rnd(g)<.3?'S':'W'; } else { b=pk([0,0,1,1,1,2,2,3]); s=pk([0,0,1,1,1,2]); last='X'; }
  const early=shuffle(Array(b).fill('B').concat(Array.from({length:s},strike))), out=[]; let st=0;
  for(const c of early){ out.push(c); if(c!=='B') st++; }
  if(st===2){ for(let f=res==='k'?pk([0,0,1,1,2,3]):pk([0,0,0,1]);f>0;f--) out.push('F'); }
  return out.concat(last); }

/* A ball in play: where it goes and who fields it, for the screen and the words. */
function battedBall(g,res) {
  const r=()=>rnd(g), pick=a=>a[Math.floor(r()*a.length)];
  if(res==='out'){ const bb=pick(['ground','ground','ground','fly','fly','line','pop']);
    const f=bb==='ground'?pick(['SS','2B','3B','1B','SS','2B','P']):bb==='fly'?pick(['LF','CF','RF']):bb==='pop'?pick(['C','1B','3B','SS','2B']):pick(['SS','2B','3B','1B','LF','CF','RF']);
    const [a,d]=FIELDERS[f]; return {bb,f,a:a+(r()-.5)*14,d:Math.max(.08,d+(r()-.5)*.1)}; }
  if(res===1){ const bb=r()<.55?'ground':'line', a=pick([-34,-22,-6,6,22,34])+(r()-.5)*8; return {bb,f:a<-14?'LF':a>14?'RF':'CF',a,d:bb==='ground'?.66:.62+r()*.08}; }
  if(res===2){ const line=r()<.35, a=line?(r()<.5?-41:41):(r()<.5?-16:16)+(r()-.5)*8; return {bb:'line',f:a<-10?'LF':a>10?'RF':'CF',a,d:.86+r()*.1}; }
  if(res===3){ const a=r()<.5?-39:39; return {bb:'fly',f:a<0?'LF':'RF',a,d:.98}; }
  const a=(r()-.5)*80; return {bb:'hr',f:a<-14?'LF':a>14?'RF':'CF',a,d:1.12+r()*.12};
}
function playWords(res,bb,last) { const side=bb.a<-14?'left':bb.a>14?'right':'center';
  if(res==='walk') return 'walks'; if(res==='k') return last==='S'?'strikes out looking':'strikes out swinging';
  if(res==='out') return bb.bb==='ground'?'grounds out to '+FIELD_WORD[bb.f]:bb.bb==='fly'?'flies out to '+FIELD_WORD[bb.f]:bb.bb==='pop'?'pops up to '+FIELD_WORD[bb.f]:'lines out to '+FIELD_WORD[bb.f];
  if(res===1) return bb.bb==='ground'?'singles through the infield into '+side:'lines a single to '+side;
  if(res===2) return Math.abs(bb.a)>35?'doubles down the '+(bb.a<0?'third':'first')+'-base line':'doubles into the '+(bb.a<0?'left':'right')+'-center gap';
  if(res===3) return 'triples into the '+(bb.a<0?'left':'right')+'-field corner'; return 'hits a home run to '+side+'!'; }

/* One step. Returns 'ask' when the game waits for the player's answer, 'hold' when the player asked to stop between
   batters, 'done' at the end, otherwise ''. */
function stepGame(L,g) {
  if(g.done) return 'done';
  const bat=g.half, def=1-bat, teams=[gClub(L,g,0),gClub(L,g,1)];
  if(!g.started){ g.started=true; g.outs=0; g.bases=[0,0,0]; g.line[bat].push(0);
    snap(g,{kind:'head',t:(bat?'Bottom':'Top')+' of the '+nth(g.inning)+'. '+teams[bat].short+' batting; '+gPlayer(L,g,def,g.pitcher[def]).name+' pitching.'}); return ''; }
  if(!g.pa){
    if(g.ask) return 'ask';
    if(g.hold) return 'hold';
    for(const side of [def,bat]){ const idea=side===def?ionaPitching(L,g,side):(ionaBatting(L,g,side)||ionaSteal(L,g,side)); if(!idea) continue;
      if(side===g.manage){ const key=idea.key||idea.kind+':'+(idea.out||g.pitcher[side])+':'+(idea.kind==='ph'||idea.kind==='pr'?g.inning:''); if(g.asked[key]) continue; g.ask=Object.assign({key},idea); return 'ask'; }
      applyIdea(L,g,idea); }
    const b=gPlayer(L,g,bat,g.lineup[bat][g.order[bat]]), p=gPlayer(L,g,def,g.pitcher[def]);
    const glove=g.lineup[def].reduce((n,id)=>n+gPlayer(L,g,def,id).glove,0)/9, res=plateAppearance(g,formRatings(b),effective(g,def,p),glove);
    g.pa={b:b.id,res,seq:pitchesFor(g,res),i:0}; g.pbox[p.id].bf++; g.balls=0; g.strikes=0;
    if(!g.steal&&bat!==g.manage&&g.outs<2){ for(const base of [1,0]){ const id=g.bases[base]; if(!id||g.bases[base+1]) continue; const r=gPlayer(L,g,bat,id), sp=spd(r);
      if(sp>=60&&rnd(g)<(sp-55)*.012*(base===1?.4:1)){ g.steal={side:bat,base}; break; } } }
    snap(g,{kind:'up',t:''}); return ''; }
  const pa=g.pa, pb=g.pbox[g.pitcher[def]];
  if(g.steal&&pa.i===0){ const {base}=g.steal, id=g.bases[base]; g.steal=null;
    if(id&&!g.bases[base+1]&&base<2){ const r=gPlayer(L,g,bat,id), cat=gPlayer(L,g,def,g.lineup[def].map(x=>gPlayer(L,g,def,x)).find(x=>x.pos==='C')?.id||g.lineup[def][0]), st=g.box[id]||(g.box[id]=bline());
      const safe=rnd(g)<stealChance(L,g,bat,base), to=['second','third'][base];
      if(safe){ g.bases[base+1]=id; g.bases[base]=0; st.sb++; snap(g,{kind:'play',steal:true,moves:[{id,from:base+1,to:base+2}],runs:0,t:r.name+' steals '+to+'!'}); }
      else { g.bases[base]=0; st.cs++; g.outs++; pb.outs++; snap(g,{kind:'play',steal:true,moves:[{id,from:base+1,to:base+2,out:true}],runs:0,t:r.name+' is thrown out trying to steal '+to+' by '+lastName(cat)+'.'});
        if(g.outs>=3){ g.pa=null; g.balls=0; g.strikes=0; return endHalf(L,g); } }
      return ''; } }
  if(pa.i<pa.seq.length){ const c=pa.seq[pa.i++]; pb.pitches++;
    if(c==='B') g.balls=Math.min(4,g.balls+1); else if(c==='S'||c==='W') g.strikes=Math.min(3,g.strikes+1); else if(c==='F'&&g.strikes<2) g.strikes++;
    snap(g,{kind:'pitch',pitch:c,t:''}); return ''; }
  // The result of the plate appearance.
  const b=gPlayer(L,g,bat,pa.b), p=gPlayer(L,g,def,g.pitcher[def]), s=g.box[b.id]||(g.box[b.id]=bline()), res=pa.res;
  const bb=res==='walk'||res==='k'?null:battedBall(g,res), moves=[], scored=[]; let dp=false;
  const run=(id,from,to)=>{ moves.push({id,from,to}); if(to>=4) scored.push(id); };
  if(res==='walk'){ s.bb++; pb.bb++; const nb=g.bases.slice(); // only forced runners move up
    if(nb[0]){ if(nb[1]){ if(nb[2]) run(nb[2],3,4); run(nb[1],2,3); nb[2]=nb[1]; } run(nb[0],1,2); nb[1]=nb[0]; }
    nb[0]=b.id; run(b.id,0,1); g.bases=nb; }
  else if(res==='k'||res==='out'){ s.ab++; pb.outs++; g.outs++; if(res==='k'){s.k++;pb.k++;} moves.push({id:b.id,from:0,to:0,out:true});
    if(res==='out'&&bb.bb==='ground'&&g.outs<3&&g.bases[0]&&rnd(g)<clamp(.38-(spd(b)-50)*.006,.15,.6)){ const r1=g.bases[0]; moves.push({id:r1,from:1,to:2,out:true}); g.bases[0]=0; g.outs++; pb.outs++; dp=true;
      if(g.outs<3){ if(g.bases[2]){ run(g.bases[2],3,4); g.bases[2]=0; } if(g.bases[1]){ moves.push({id:g.bases[1],from:2,to:3}); g.bases[2]=g.bases[1]; g.bases[1]=0; } } }
    else if(res==='out'&&g.outs<3&&g.bases[2]&&rnd(g)<clamp(.35+(spd(gPlayer(L,g,bat,g.bases[2]))-50)*.006,.15,.6)){ run(g.bases[2],3,4); g.bases[2]=0; } }
  else { s.ab++; s.h++; pb.h++; g.hits[bat]++; if(res===2)s.d++; if(res===3)s.t++; if(res===4){s.hr++;pb.hr++;}
    for(let i=2;i>=0;i--){ const id=g.bases[i]; if(!id) continue; g.bases[i]=0; const r=gPlayer(L,g,bat,id), extra=(res<3&&i+res===2&&rnd(g)<clamp(.55+(spd(r)-50)*.008,.2,.85))?1:0;
      const to=i+1+res+extra; run(id,i+1,Math.min(4,to)); if(to<4) g.bases[to-1]=id; }
    run(b.id,0,res); if(res<4) g.bases[res-1]=b.id; }
  for(const id of scored) (g.box[id]||(g.box[id]=bline())).r++;
  const n=scored.length; s.rbi+=n; pb.r+=n; g.score[bat]+=n; g.line[bat][g.line[bat].length-1]+=n;
  if(n){ const lead=g.score[0]>g.score[1]?0:g.score[1]>g.score[0]?1:-1; if(lead===bat&&(!g.rec||g.rec.lead!==bat)) g.rec={lead:bat,w:g.pitcher[bat],l:g.pitcher[def]}; else if(lead<0) g.rec=null; }
  const names=scored.map(id=>lastName(gPlayer(L,g,bat,id))), last=pa.seq[pa.seq.length-1];
  let text=b.name+' '+playWords(res,bb||{},last)+'.';
  if(res==='k') text=b.name+' '+playWords(res,{},last)+' against '+lastName(p)+'.';
  if(dp) text=b.name+' grounds into a double play.';
  if(n) text+=' '+(res===4&&n===1?'':(n===1?names[0]+' scores.':names.slice(0,-1).join(', ')+' and '+names[n-1]+' score.'));
  g.pa=null; g.balls=0; g.strikes=0; g.order[bat]=(g.order[bat]+1)%9;
  snap(g,{kind:'play',res,bb,moves,runs:n,t:text.trim(),who:lastName(b)});
  if(g.inning>=9&&bat===1&&g.score[1]>g.score[0]) return endGame(L,g);
  if(g.outs>=3) return endHalf(L,g);
  return '';
}
function endHalf(L,g) { const bat=g.half; g.started=false; g.bases=[0,0,0]; g.steal=null;
  { if(bat===0&&g.inning>=9&&g.score[1]>g.score[0]) return endGame(L,g);
    if(bat===1&&g.inning>=9&&g.score[0]!==g.score[1]) return endGame(L,g);
    if(bat===1&&g.inning>=15){ g.score[1]++; g.line[1][g.line[1].length-1]++; g.rec={lead:1,w:g.pitcher[1],l:g.pitcher[0]}; g.pbox[g.pitcher[0]].r++; const hero=g.lineup[1][g.order[1]]; (g.box[hero]||(g.box[hero]=bline())).r++;
      snap(g,{kind:'play',runs:1,moves:[],t:'A wild pitch brings the winning run home in the fifteenth.'}); return endGame(L,g); }
    if(bat===1) g.inning++; g.half=1-g.half; g.outs=0; }
  return '';
}
function endGame(L,g) { g.done=true; g.ask=null; g.winner=g.score[1]>g.score[0]?g.home:g.away; const ws=g.score[1]>g.score[0]?1:0;
  const rec=g.rec&&g.rec.lead===ws?g.rec:{w:g.pitcher[ws],l:g.pitcher[1-ws]};
  // A starter needs five innings for the win; otherwise it goes to the reliever who pitched the most.
  let w=rec.w; if(w===g.starters[ws]&&g.pbox[w].outs<15){ const rel=g.used[ws].filter(id=>id!==w).sort((a,b)=>g.pbox[b].outs-g.pbox[a].outs)[0]; if(rel) w=rel; }
  g.decision={w,l:rec.l}; snap(g,{kind:'end',t:'Final: '+gClub(L,g,0).short+' '+g.score[0]+', '+gClub(L,g,1).short+' '+g.score[1]+'.'}); return 'done'; }
/* Run to the end; the player's side is handed to Iona. */
function finishGame(L,g) { g.manage=-1; g.ask=null; g.hold=false; let n=0; while(!g.done&&n++<20000) stepGame(L,g); return g; }
/* The whole game at once, as before (other clubs' games, simulated days, the tests). */
function playGame(L,home,away,seed,quiet=false) { return finishGame(L,newGame(L,home,away,seed,-1,quiet)); }

/* A box score that outlives the game (the last one is kept in the save). */
function boxScore(L,g) { return {home:g.home,away:g.away,score:g.score.slice(),line:g.line.map(l=>l.slice()),hits:g.hits.slice(),
  bat:[0,1].map(side=>g.bat[side].map(id=>{const p=gPlayer(L,g,side,id); return p?Object.assign({id,name:p.name,pos:p.pos,sub:!g.first[side].includes(id)},g.box[id]||bline()):null;}).filter(Boolean)),
  pit:[0,1].map(side=>g.used[side].map(id=>{const p=gPlayer(L,g,side,id); return p?Object.assign({id,name:p.name,dec:g.decision&&g.decision.w===id?'W':g.decision&&g.decision.l===id?'L':''},g.pbox[id]):null;}).filter(Boolean))}; }
