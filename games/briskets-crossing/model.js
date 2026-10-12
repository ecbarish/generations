/* AC3: Brisket's Crossing rules. Deterministic; no DOM, timers or storage. */
(function(root){'use strict';
 const COLS=13,ROWS=11,W=640,H=640,LIVES=3,TIME=42,HOP=0.16,RECOVERY=.75;
 const HOME_COLS=[1,4,6,8,11];
 const START={x:6,y:10};
 function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 function laneKind(y){return y===0?'home':y<=4?'river':y===5?'safe':y<=9?'road':'start';}
 // Give new players room to read the crossing. Run four rejoins the original curve.
 function plan(n){const opening=Math.max(0,(4-n)/3);return {speed:1.15+Math.min(2.4,(n-1)*.28)-.35*opening,time:Math.max(20,TIME-(n-1)*2)+14*opening,opening};}
 function wrap(x){return (x%COLS+COLS)%COLS;}
 function spanHits(left,width,point){const a=wrap(left),b=a+width;if(b<=COLS)return point>=a&&point<b;return point>=a||point<b-COLS;}
 function buildLanes(random,round){
  const lanes=[];
  for(let y=1;y<=9;y++){
   const kind=laneKind(y);if(kind!=='road'&&kind!=='river')continue;
   const dir=y%2===0?1:-1,p=plan(round);
   const speed=p.speed*(kind==='river'?.68:1)*(0.9+(y%3)*.08);
   const width=kind==='river'?2.35+(y%2)*.85+p.opening*(y%2?.6:1.15):1.65;
   const count=kind==='river'?3:round<=2?3:4;
   // Equal opening intervals also remove the old cramped wrap-around wagon gap.
   const gap=p.opening>0?COLS/count:kind==='river'?4.6:3.55,items=[];
   let x=random()*gap;
   // The first invitation to hop is into open road, rather than a random wagon.
   if(round===1&&y===9)x=START.x+.5-width-(gap-width)/2;
   for(let i=0;i<count;i++){items.push({x:wrap(x),w:width});x+=gap;}
   lanes.push({y,dir,speed,kind,items});
  }
  return lanes;
 }
 function fresh(round){return {x:START.x+.5,y:START.y,tx:START.x+.5,ty:START.y,hop:0,lives:LIVES,score:0,round,homes:HOME_COLS.map(c=>({x:c+.5,filled:false})),time:plan(round).time,best:START.y,ended:false,clearing:0,recovery:0,awaitRelease:false,lanes:null};}
 function player(random,round){const p=fresh(round);p.lanes=buildLanes(random,round);return p;}
 function create(count=1,seed=1){const random=rng(seed),s={players:Array.from({length:count===2?2:1},()=>player(random,1)),active:0,phase:'ready',paused:false,elapsed:0,events:[],random};return s;}
 function current(s){return s.players[s.active];}
 function ready(s){if(s.phase!=='ready')return false;s.phase='playing';return true;}
 function endTurn(s){const p=current(s);if(p.ended||s.phase!=='playing')return;p.ended=true;s.events.push('turn');const next=s.players.findIndex((q,i)=>i!==s.active&&!q.ended);if(next>=0){s.active=next;s.phase='ready';}else s.phase='over';}
 function respawn(p){p.x=START.x+.5;p.y=START.y;p.tx=p.x;p.ty=p.y;p.hop=0;p.best=START.y;p.time=plan(p.round).time;}
 function hurt(s,cause='cart'){const p=current(s);if(p.ended||p.clearing>0||p.recovery>0)return;p.hitCause=cause;p.lives--;s.events.push('hit');if(p.lives<=0)endTurn(s);else {respawn(p);p.recovery=RECOVERY;p.awaitRelease=true;}}
 function onLog(p){const lane=p.lanes.find(l=>l.y===p.y&&l.kind==='river');if(!lane)return null;return lane.items.find(it=>spanHits(it.x,it.w,p.x))||null;}
 function hitCart(p){const lane=p.lanes.find(l=>l.y===p.y&&l.kind==='road');if(!lane)return false;return lane.items.some(it=>spanHits(it.x,it.w,p.x));}
 function deliver(s,p){
  const home=p.homes.find(h=>!h.filled&&Math.abs(h.x-p.x)<.35);
  if(!home){hurt(s,'post');return;}
  home.filled=true;p.score+=100+Math.ceil(p.time);s.events.push('lantern');
  if(p.homes.every(h=>h.filled)){p.score+=200;p.clearing=1.4;s.events.push('clear');return;}
  respawn(p);
 }
 function finishHop(s,p){
  p.x=p.tx;p.y=p.ty;p.hop=0;
  if(p.y<p.best){p.score+=10*(p.best-p.y);p.best=p.y;s.events.push('step');}
  const kind=laneKind(p.y);
  if(kind==='home')deliver(s,p);
  else if(kind==='road'&&hitCart(p))hurt(s);
  else if(kind==='river'&&!onLog(p))hurt(s,'river');
 }
 function hop(s,dx,dy){
  const p=current(s);
  if(s.phase!=='playing'||s.paused||p.hop>0||p.clearing>0||p.recovery>0||p.awaitRelease||p.ended)return false;
  dx=Math.max(-1,Math.min(1,dx|0));dy=Math.max(-1,Math.min(1,dy|0));
  if(dx&&dy)dy=0;if(!dx&&!dy)return false;
  const nx=Math.round(p.x-.5)+dx,ny=p.y+dy;
  if(nx<0||nx>=COLS||ny<0||ny>=ROWS)return false;
  p.fromx=p.x;p.fromy=p.y;p.tx=nx+.5;p.ty=ny;p.hop=HOP;s.events.push('hop');return true;
 }
 function pose(p){if(p.hop<=0)return {x:p.x,y:p.y};const u=1-p.hop/HOP;return {x:p.fromx+(p.tx-p.fromx)*u,y:p.fromy+(p.ty-p.fromy)*u};}
 function moveLanes(p,dt){for(const lane of p.lanes)for(const it of lane.items)it.x=wrap(it.x+lane.dir*lane.speed*dt);}
 function step(s,dt,input={},held=input){
  s.events=[];if(s.phase!=='playing'||s.paused)return;s.elapsed+=dt;const p=current(s);
  if(p.clearing>0){p.clearing-=dt;if(p.clearing<=0){p.round++;p.homes.forEach(h=>h.filled=false);p.lanes=buildLanes(s.random,p.round);if(p.round%2===1&&p.lives<LIVES){p.lives++;s.events.push('life');}respawn(p);s.events.push('round');}return;}
  if(p.recovery>0){p.recovery=Math.max(0,p.recovery-dt);return;}
  if(p.awaitRelease){if(!held.dx&&!held.dy)p.awaitRelease=false;return;}
  let ride=null;
  if(p.hop<=0&&laneKind(p.y)==='river'){const lane=p.lanes.find(l=>l.y===p.y),log=onLog(p);if(!log)ride='drown';else{p.x+=lane.dir*lane.speed*dt;if(p.x<0||p.x>=COLS)ride='off';}}
  moveLanes(p,dt);
  if(ride){hurt(s,'river');return;}
  if((input.dx||input.dy)&&p.hop<=0)hop(s,input.dx||0,input.dy||0);
  p.time=Math.max(0,p.time-dt);
  if(p.hop>0){p.hop=Math.max(0,p.hop-dt);if(p.hop<=0)finishHop(s,p);}
  if(p.ended||p.clearing>0||p.hop>0)return;
  if(laneKind(p.y)==='road'&&hitCart(p)){hurt(s);return;}
  if(!p.ended&&p.time<=0)hurt(s,'time');
 }
 function advance(s,dt,input={}){let left=Math.max(0,Math.min(.25,dt)),events=[],first=true;while(left>0){const tick=Math.min(left,1/120);step(s,tick,first?input:{},input);first=false;events.push(...s.events);left-=tick;}s.events=events;return s;}
 function scores(data){return (Array.isArray(data)?data:[]).filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&typeof r.name==='string'&&/^[A-Z0-9]{3}$/.test(r.name)).map(r=>({name:r.name,score:r.score})).sort((a,b)=>b.score-a.score).slice(0,5);}
 function record(table,name,score){const clean=String(name||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3).padEnd(3,'A');return scores([...scores(table),{name:clean,score}]);}
 const api={COLS,ROWS,W,H,LIVES,TIME,HOP,RECOVERY,HOME_COLS,START,laneKind,plan,create,current,ready,advance,hop,hurt,endTurn,onLog,hitCart,pose,scores,record};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.BrisketModel=api;
})(typeof window==='object'?window:globalThis);

