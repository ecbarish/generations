'use strict';
/* Lamplight Field from above. The stands and light towers grow with the ballpark upgrades. During a game the nine
   fielders stand at their positions, the batter waits at the plate, runners lead off the bases, and each pitch and
   each ball in play is drawn: the pitch to the plate, the swing, the ball's flight, the fielder chasing it, the throw,
   and the runners going round. Drawing never changes the league. */
let PERSON=1;
function drawField(cv, L, scene) {
  const dpr=Math.min(2,window.devicePixelRatio||1), w=cv.clientWidth, h=cv.clientHeight;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
  for(let x=0;x<w;x+=36){c.fillStyle=(x/36)%2?'#2a6b3c':'#256236';c.fillRect(x,0,36,h);}
  // The park is sized to the window: home plate near the bottom middle, the outfield fence near the top.
  const s=Math.min(w/2.4,h/1.25), hx=w/2, hy=h*.5+s*.5, base=s*.42;
  PERSON=Math.max(1,Math.min(2.5,s/210)); // people grow with the park, so a big screen doesn't show specks (playtest DM2)
  const u=L?L.upgrades:{seats:0,lights:0};
  c.save(); c.translate(hx,hy);
  for(let i=u.seats;i>=0;i--){ c.fillStyle=i%2?'#5b4a3a':'#6b5845'; c.beginPath(); c.arc(0,0,s*(1.02+i*.07+.07),Math.PI*1.2,Math.PI*1.8); c.arc(0,0,s*(1.02+i*.07),Math.PI*1.8,Math.PI*1.2,true); c.fill();
    c.fillStyle='#d9c9a8'; for(let a=1.22;a<1.78;a+=.018+.01*((i*7)%3)/3){ const rr=s*(1.055+i*.07); c.fillRect(Math.cos(a*Math.PI)*rr-1,Math.sin(a*Math.PI)*rr-1,2,2);} }
  c.strokeStyle='#e8dcae'; c.lineWidth=3; c.beginPath(); c.arc(0,0,s,Math.PI*1.25,Math.PI*1.75); c.stroke();
  c.strokeStyle='#f4f1e4'; c.lineWidth=2; c.beginPath(); c.moveTo(0,0); c.lineTo(-s*.707,-s*.707); c.moveTo(0,0); c.lineTo(s*.707,-s*.707); c.stroke();
  c.fillStyle='#b98b5a'; c.beginPath(); c.moveTo(0,8); c.lineTo(-base*.8,-base*.75); c.quadraticCurveTo(0,-base*2.1,base*.8,-base*.75); c.closePath(); c.fill();
  c.fillStyle='#2f7a44'; c.beginPath(); c.moveTo(0,-base*.18); c.lineTo(-base*.55,-base*.72); c.lineTo(0,-base*1.26); c.lineTo(base*.55,-base*.72); c.closePath(); c.fill();
  const B=[[0,0],[base*.72,-base*.72],[0,-base*1.44],[-base*.72,-base*.72],[0,0]];
  B.slice(1,4).forEach(([x,y])=>{ c.fillStyle='#fff'; c.save(); c.translate(x,y); c.rotate(Math.PI/4); c.fillRect(-5,-5,10,10); c.restore(); });
  c.fillStyle='#fff'; c.fillRect(-5,-3,10,7);
  c.fillStyle='#c79a66'; c.beginPath(); c.arc(0,-base*.72,9,0,7); c.fill();
  for(let i=0;i<u.lights;i++) for(const side of [-1,1]){ const a=Math.PI*(1.5+side*(.2+i*.08)), x=Math.cos(a)*s*1.25, y=Math.sin(a)*s*1.25;
    c.fillStyle='#3a3a3a'; c.fillRect(x-2,y,4,26); c.fillStyle='#fff6c8'; c.fillRect(x-9,y-6,18,8); c.fillStyle='rgba(255,246,200,.08)'; c.beginPath(); c.arc(x,y,60,0,7); c.fill(); }
  if(scene) drawPlay(c,s,B,scene);
  c.restore();
  c.fillStyle='#1b3639d0'; c.fillRect(12,h-42,180,30); c.fillStyle='#fff4cd'; c.font='12px system-ui'; c.fillText('LAMPLIGHT FIELD',24,h-22);
  return {s,base};
}
/* Field spots are given as an angle from straight out to center field (degrees, left is negative) and a distance as
   a share of the fence. */
function spot(s,a,d){ const r=a*Math.PI/180; return [Math.sin(r)*d*s, -Math.cos(r)*d*s]; }
const lerp=(a,b,t)=>a+(b-a)*t, ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
/* A runner's place between two bases (0 home, 1 first, 2 second, 3 third, 4 home again), t from 0 to 1. */
function alongBases(B,from,to,t){ if(to<=from) return B[from]; const legs=to-from, x=t*legs, k=Math.min(legs-1,Math.floor(x)), f=x-k, p=B[from+k], q=B[from+k+1]; return [lerp(p[0],q[0],f),lerp(p[1],q[1],f)]; }
function tag(c,x,y,text){ c.save(); c.font='600 12px system-ui'; const wd=c.measureText(text).width+10; c.fillStyle='#0f2427d8'; c.fillRect(x-wd/2,y-9,wd,18); c.fillStyle='#fff4cd'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,x,y); c.restore(); }
/* scene: {e (the event on screen), prev (the runners before it), at (when it started), def and bat colours, names}. */
function drawPlay(c,s,B,sc){
  const e=sc.e, t=(performance.now()-sc.at), mound=spot(s,0,.30), home=[0,0], plate=[-14,-6];
  const play=e.kind==='play'&&e.bb, dur=play?(e.bb.bb==='hr'?1700:1400):e.kind==='play'?900:e.kind==='pitch'?520:0, k=dur?Math.min(1,t/dur):1;
  // Fielders: everyone at their spot, except the one who chases a ball in play.
  for(const [pos,[a,d]] of Object.entries(FIELDERS)){ let [x,y]=spot(s,a,d);
    if(play&&pos===e.bb.f&&e.bb.bb!=='hr'){ const [tx,ty]=spot(s,e.bb.a,Math.min(.97,e.bb.d)); const m=ease(k/.6); x=lerp(x,tx,m); y=lerp(y,ty,m); }
    if(pos==='C'){ y=Math.max(y,10); }
    person(c,x,y-8,sc.def); }
  // Runners: still ones from the bases, moving ones along the base paths.
  const moving=play||e.kind==='play'?(e.moves||[]):[], ids=new Set(moving.map(m=>m.id));
  const still=(e.kind==='play'?sc.prev:e.runners)||[0,0,0];
  still.forEach((id,i)=>{ if(id&&!ids.has(id)){ const [x,y]=B[i+1]; person(c,x+6,y-12,sc.bat); } });
  for(const m of moving){ if(m.to===0||(m.out&&(!e.steal||k>.85))) continue; const rt=ease((k-.12)/.88), [x,y]=alongBases(B,m.from,Math.min(4,m.to),rt);
    if(m.to>=4&&rt>=1) continue; person(c,x+6,y-12,sc.bat); }
  // The batter waits at the plate until the ball is in play.
  const batterGone=e.kind==='play'&&moving.some(m=>m.from===0&&m.to>0);
  if(!batterGone&&e.kind!=='end'&&e.kind!=='head'){ person(c,plate[0],plate[1],sc.bat);
    const swung=e.kind==='pitch'&&'WFX'.includes(e.pitch)&&k>.7; c.strokeStyle='#e9d3a2'; c.lineWidth=3; c.beginPath(); c.moveTo(plate[0]+4*PERSON,plate[1]-2*PERSON);
    const ang=swung?-.2:-1.9; c.lineTo(plate[0]+4*PERSON+Math.cos(ang)*14*PERSON,plate[1]-2*PERSON+Math.sin(ang)*14*PERSON); c.stroke(); }
  // The ball.
  c.fillStyle='#fff';
  if(e.kind==='pitch'&&k<1){ c.beginPath(); c.arc(lerp(mound[0],home[0],k),lerp(mound[1]-8,home[1]-4,k),3,0,7); c.fill(); }
  if(play){ const [tx,ty]=spot(s,e.bb.a,e.bb.d), fly=e.bb.bb==='fly'||e.bb.bb==='pop'||e.bb.bb==='hr', reach=Math.min(1,k/.6);
    if(k<.6||e.bb.bb==='hr'){ const r2=e.bb.bb==='hr'?Math.min(1,k):reach, x=lerp(0,tx,r2), y=lerp(0,ty,r2), lift=fly?Math.sin(r2*Math.PI)*(e.bb.bb==='pop'?50:40)*PERSON:0;
      c.fillStyle='#0004'; c.beginPath(); c.arc(x,y,3,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x,y-lift,3+(fly?Math.sin(r2*Math.PI)*2:0),0,7); c.fill(); }
    else if(e.res==='out'&&e.bb.bb==='ground'&&e.bb.f!=='1B'){ const th=ease((k-.6)/.3); c.beginPath(); c.arc(lerp(tx,B[1][0],th),lerp(ty,B[1][1],th),3,0,7); c.fill(); }
    else if(e.res!=='out'&&k<1){ const th=ease((k-.6)/.4); c.beginPath(); c.arc(lerp(tx,mound[0]*.5+B[2][0]*.5,th),lerp(ty,B[2][1],th),3,0,7); c.fill(); } }
  // Name tags, like a broadcast: who is pitching (and how many pitches), who is batting.
  if(sc.pitcher) tag(c,mound[0],mound[1]+18*PERSON,sc.pitcher);
  if(sc.batter&&e.kind!=='end') tag(c,0,24+6*PERSON,sc.batter);
  if(play&&k>=.6&&k<1){ const word=e.res==='out'?'OUT':e.res===4?'HOME RUN':e.res===3?'TRIPLE':e.res===2?'DOUBLE':'HIT'; const [x,y]=spot(s,e.bb.a,Math.min(.95,e.bb.d)); tag(c,x,y-30,word); }
  if(e.kind==='play'&&!e.bb&&k<1){ if(e.steal){ const m=e.moves[0], [x,y]=alongBases(B,m.to,m.to,1); tag(c,x,y-34,m.out?'OUT':'SAFE'); } else if(e.res==='k'||e.res==='walk') tag(c,0,-40,e.res==='k'?'STRIKE THREE':'BALL FOUR'); else if(/double play/.test(e.t)) tag(c,0,-40,'DOUBLE PLAY'); }
}
function person(c,x,y,col){ c.save(); c.translate(x,y); c.scale(PERSON,PERSON); c.fillStyle='#1d1d1d'; c.fillRect(-3,1,6,9); c.fillStyle=col; c.fillRect(-4,-1,8,8); c.fillStyle='#d9a77a'; c.fillRect(-3,-7,6,6); c.restore(); }
