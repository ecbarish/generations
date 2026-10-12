/* AC3: Ember Bricks rules. Deterministic; no DOM, timers or storage. */
(function(root){'use strict';
 const W=640,H=640,LIVES=3,COLS=10,ROWS=6,COAL_R=6,PEEL_W=96,PEEL_H=12,PEEL_Y=588,PEEL_SPEED=340,CLEAR=1.2;
 function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 function plan(n){return {speed:220+Math.min(120,(n-1)*18)};}
 function brickRect(c,r){const gap=6,left=28,top=78,bw=(W-left*2-gap*(COLS-1))/COLS,bh=20;return {x:left+c*(bw+gap),y:top+r*(bh+gap),w:bw,h:bh};}
 function overlaps(x,y,rect){const cx=Math.max(rect.x,Math.min(x,rect.x+rect.w)),cy=Math.max(rect.y,Math.min(y,rect.y+rect.h)),dx=x-cx,dy=y-cy;return dx*dx+dy*dy<=COAL_R*COAL_R;}
 function layout(){const bricks=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const tough=r===2&&c>=3&&c<=6,hp=tough?2:1;bricks.push({c,r,hp,max:hp});}return bricks;}
 function park(p){p.stuck=true;p.ball.x=p.peel;p.ball.y=PEEL_Y-COAL_R-.5;p.ball.vx=0;p.ball.vy=0;}
 function fresh(round){const p={round,lives:LIVES,score:0,ended:false,clearing:0,peel:W/2,stuck:true,ball:{x:0,y:0,vx:0,vy:0},bricks:layout()};park(p);return p;}
 function create(count=1,seed=1){return {players:Array.from({length:count===2?2:1},()=>fresh(1)),active:0,phase:'ready',paused:false,elapsed:0,events:[],random:rng(seed)};}
 function current(s){return s.players[s.active];}
 function ready(s){if(s.phase!=='ready')return false;s.phase='playing';return true;}
 function endTurn(s){const p=current(s);if(p.ended||s.phase!=='playing')return;p.ended=true;s.events.push('turn');const next=s.players.findIndex((q,i)=>i!==s.active&&!q.ended);if(next>=0){s.active=next;s.phase='ready';}else s.phase='over';}
 function hurt(s){const p=current(s);if(p.ended||p.clearing>0)return;p.lives--;s.events.push('miss');if(p.lives<=0)endTurn(s);else park(p);}
 function serve(s){const p=current(s);if(s.phase!=='playing'||s.paused||!p.stuck||p.clearing>0||p.ended)return false;const speed=plan(p.round).speed,ang=-Math.PI/2+(s.random()*2-1)*.55;p.stuck=false;p.ball.vx=Math.cos(ang)*speed;p.ball.vy=Math.sin(ang)*speed;s.events.push('serve');return true;}
 function step(s,dt,input={}){
  s.events=[];if(s.phase!=='playing'||s.paused)return;s.elapsed+=dt;const p=current(s);
  if(p.clearing>0){p.clearing-=dt;if(p.clearing<=0){p.round++;if(p.round%2===1&&p.lives<LIVES){p.lives++;s.events.push('life');}p.bricks=layout();park(p);s.events.push('round');}return;}
  const dx=Math.max(-1,Math.min(1,Number(input.dx)||0));
  p.peel=Math.max(PEEL_W/2,Math.min(W-PEEL_W/2,p.peel+dx*PEEL_SPEED*dt));
  if(p.stuck){park(p);if(input.launch)serve(s);return;}
  let x=p.ball.x+p.ball.vx*dt,y=p.ball.y+p.ball.vy*dt;
  if(x<COAL_R){x=COAL_R;p.ball.vx=Math.abs(p.ball.vx);s.events.push('tap');}
  if(x>W-COAL_R){x=W-COAL_R;p.ball.vx=-Math.abs(p.ball.vx);s.events.push('tap');}
  if(y<COAL_R){y=COAL_R;p.ball.vy=Math.abs(p.ball.vy);s.events.push('tap');}
  const prevx=p.ball.x,prevy=p.ball.y,hit=p.bricks.find(b=>overlaps(x,y,brickRect(b.c,b.r)));
  if(hit){
   const rect=brickRect(hit.c,hit.r),fromSide=prevx<rect.x||prevx>rect.x+rect.w,fromFace=prevy<rect.y||prevy>rect.y+rect.h;
   if(fromSide&&!fromFace)p.ball.vx*=-1;else if(fromFace&&!fromSide)p.ball.vy*=-1;else{p.ball.vx*=-1;p.ball.vy*=-1;}
   const worth=(ROWS-hit.r)*10;hit.hp--;p.score+=hit.hp>0?Math.ceil(worth/2):worth;s.events.push(hit.hp>0?'crack':'brick');
   if(hit.hp<=0)p.bricks=p.bricks.filter(b=>b!==hit);
   p.ball.x=prevx;p.ball.y=prevy;
   if(!p.bricks.length){p.score+=200;p.clearing=CLEAR;s.events.push('clear');}
   return;
  }
  const left=p.peel-PEEL_W/2,right=p.peel+PEEL_W/2;
  if(p.ball.vy>0&&prevy<PEEL_Y&&y+COAL_R>=PEEL_Y&&x>=left&&x<=right){
   const speed=Math.hypot(p.ball.vx,p.ball.vy)||plan(p.round).speed,offset=Math.max(-1,Math.min(1,(x-p.peel)/(PEEL_W/2)));
   const ang=-Math.PI/2+offset*.75+Math.sign(p.ball.vx||1)*.05;
   p.ball.vx=Math.cos(ang)*speed;p.ball.vy=Math.sin(ang)*speed;y=PEEL_Y-COAL_R-.5;s.events.push('peel');
  }
  p.ball.x=x;p.ball.y=y;
  if(p.ball.y-COAL_R>H)hurt(s);
 }
 function advance(s,dt,input={}){let left=Math.max(0,Math.min(.25,dt)),events=[],first=true;while(left>0){const tick=Math.min(left,1/120);step(s,tick,first?input:{dx:input.dx||0});first=false;events.push(...s.events);left-=tick;}s.events=events;return s;}
 function scores(data){return (Array.isArray(data)?data:[]).filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&typeof r.name==='string'&&/^[A-Z0-9]{3}$/.test(r.name)).map(r=>({name:r.name,score:r.score})).sort((a,b)=>b.score-a.score).slice(0,5);}
 function record(table,name,score){const clean=String(name||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3).padEnd(3,'A');return scores([...scores(table),{name:clean,score}]);}
 const api={W,H,LIVES,COLS,ROWS,COAL_R,PEEL_W,PEEL_H,PEEL_Y,PEEL_SPEED,create,current,ready,advance,serve,brickRect,plan,layout,scores,record};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.EmberModel=api;
})(typeof window==='object'?window:globalThis);
