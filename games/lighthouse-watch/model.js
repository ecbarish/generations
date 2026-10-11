/* AC2: Lighthouse Watch rules. Deterministic; no DOM, timers or storage. */
(function(root){'use strict';
 const W=640,H=640,TOWER={x:320,y:476},BOATS=[80,175,465,560],BOAT_Y=566,MAX_BURSTS=3;
 function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 function wavePlan(n){return {count:8+n*2,every:Math.max(.45,1.6-n*.12),speed:38+Math.min(110,(n-1)*10),split:n>=3?Math.min(.35,.1+n*.03):0};}
 function player(){return {aim:{x:W/2,y:260},boats:BOATS.map(x=>({x,afloat:true})),score:0,wave:1,sparks:[],beams:[],bursts:[],toSpawn:wavePlan(1).count,spawnIn:1,fire:0,clearing:0,ended:false};}
 function create(count=1,seed=1){return {players:Array.from({length:count===2?2:1},player),active:0,phase:'ready',paused:false,elapsed:0,events:[],random:rng(seed)};}
 function current(s){return s.players[s.active];}
 function ready(s){if(s.phase!=='ready')return false;s.phase='playing';return true;}
 function afloat(p){return p.boats.filter(b=>b.afloat);}
 function endTurn(s){const p=current(s);if(p.ended||s.phase!=='playing')return;p.ended=true;s.events.push('turn');const next=s.players.findIndex((q,i)=>i!==s.active&&!q.ended);if(next>=0){s.active=next;s.phase='ready';}else s.phase='over';}
 function spark(s,p,from,plan){const live=afloat(p);if(!live.length)return;const t=live[Math.floor(s.random()*live.length)],x0=from?from.x:20+s.random()*(W-40),y0=from?from.y:-6,dx=t.x-x0,dy=BOAT_Y-y0,len=Math.hypot(dx,dy)||1;p.sparks.push({x:x0,y:y0,vx:dx/len*plan.speed,vy:dy/len*plan.speed,split:!from&&s.random()<plan.split,splitAt:150+s.random()*170,target:t.x});}
 function fireAt(s,x,y){const p=current(s);if(s.phase!=='playing'||s.paused||p.clearing>0||p.fire>0||p.beams.length+p.bursts.length>=MAX_BURSTS)return false;x=Math.max(10,Math.min(W-10,x));y=Math.max(30,Math.min(TOWER.y-40,y));p.beams.push({x:TOWER.x,y:TOWER.y,tx:x,ty:y});p.fire=.22;s.events.push('shot');return true;}
 function step(s,dt,input={}){
  s.events=[];if(s.phase!=='playing'||s.paused)return;s.elapsed+=dt;const p=current(s),plan=wavePlan(p.wave);p.fire=Math.max(0,p.fire-dt);
  if(input.at){p.aim.x=input.at.x;p.aim.y=input.at.y;}
  p.aim.x=Math.max(10,Math.min(W-10,p.aim.x+Math.max(-1,Math.min(1,input.dx||0))*330*dt));p.aim.y=Math.max(30,Math.min(TOWER.y-40,p.aim.y+Math.max(-1,Math.min(1,input.dy||0))*330*dt));
  if(input.fire)fireAt(s,p.aim.x,p.aim.y);
  if(p.clearing>0){p.clearing-=dt;if(p.clearing<=0){p.wave++;if(p.wave%3===1){const lost=p.boats.find(b=>!b.afloat);if(lost){lost.afloat=true;s.events.push('boat');}}p.toSpawn=wavePlan(p.wave).count;p.spawnIn=1;p.sparks=[];p.beams=[];p.bursts=[];s.events.push('wave');}return;}
  p.spawnIn-=dt;if(p.toSpawn>0&&p.spawnIn<=0){spark(s,p,null,plan);p.toSpawn--;p.spawnIn=plan.every*(.6+s.random()*.8);}
  p.beams=p.beams.filter(b=>{const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy),mv=900*dt;if(d<=mv){p.bursts.push({x:b.tx,y:b.ty,t:0,r:0});s.events.push('burst');return false;}b.x+=dx/d*mv;b.y+=dy/d*mv;return true;});
  p.bursts=p.bursts.filter(b=>{b.t+=dt;b.r=b.t<.35?36*b.t/.35:b.t<.6?36:Math.max(0,36*(1-(b.t-.6)/.35));return b.t<.95;});
  const born=[];p.sparks=p.sparks.filter(k=>{k.x+=k.vx*dt;k.y+=k.vy*dt;if(p.bursts.some(b=>Math.hypot(b.x-k.x,b.y-k.y)<b.r+3)){p.score+=25;s.events.push('spark');return false;}if(k.split&&k.y>=k.splitAt){k.split=false;for(let i=0;i<2;i++)born.push(k);}if(k.y>=BOAT_Y-6){const boat=p.boats.find(b=>b.afloat&&Math.abs(b.x-k.x)<30);if(boat){boat.afloat=false;s.events.push('hit');}return false;}return true;});
  for(const k of born)spark(s,p,{x:k.x,y:k.y},plan);
  if(!afloat(p).length){endTurn(s);return;}
  if(p.toSpawn<=0&&!p.sparks.length){p.score+=100*afloat(p).length;p.clearing=1.6;p.beams=[];s.events.push('clear');}
 }
 function advance(s,dt,input={}){let left=Math.max(0,Math.min(.25,dt)),events=[],first=true;while(left>0){const tick=Math.min(left,1/120);step(s,tick,first?input:{dx:input.dx,dy:input.dy});first=false;events.push(...s.events);left-=tick;}s.events=events;return s;}
 function scores(data){return (Array.isArray(data)?data:[]).filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&typeof r.name==='string'&&/^[A-Z0-9]{3}$/.test(r.name)).map(r=>({name:r.name,score:r.score})).sort((a,b)=>b.score-a.score).slice(0,5);}
 function record(table,name,score){const clean=String(name||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3).padEnd(3,'A');return scores([...scores(table),{name:clean,score}]);}
 const api={W,H,TOWER,BOATS,BOAT_Y,MAX_BURSTS,create,current,ready,advance,fireAt,endTurn,afloat,wavePlan,scores,record};if(typeof module==='object'&&module.exports)module.exports=api;else root.WatchModel=api;
})(typeof window==='object'?window:globalThis);
