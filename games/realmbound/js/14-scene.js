'use strict';
/* =================== scene =================== */
const cv=$('#scene'),cx=cv.getContext('2d');let PW=0,PH=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){const r=cv.getBoundingClientRect();const d=Math.min(2,devicePixelRatio||1);PW=r.width;PH=r.height;cv.width=Math.round(PW*d);cv.height=Math.round(PH*d);cx.setTransform(d,0,0,d,0,0);cx.imageSmoothingEnabled=false;}
if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);else addEventListener('resize',resize);
function drawHero(x,y,p,t,g,pose){g=g||cx;if(pose){const h=H();return drawFacingPerson(x,y,p,{race:h.race,cls:h.cls,hair:RACES[h.race].hair,...pose},t,g);} // g: the canvas to draw on (the light engine redraws sprites as shadows)
const h=H(),r=RACES[h.race],K=CLASSES[h.cls];const q=(gx,gy,w,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+gx*p),Math.round(y+gy*p),Math.ceil(w*p),Math.ceil(hh*p));};
  const sit=C.phase==='rest'||(C.phase==='intown'&&!TOWN.on);const dy=sit?3:0; // in a walkable town (22-town.js) you stand and walk
  if(C.phase==='dead')g.globalAlpha=.4;
  q(2,10+dy,1,sit?1:3,'#2b2b3a');q(5,10+dy,1,sit?1:3,'#2b2b3a');
  q(1,5+dy,6,5,K.col);q(1,9+dy,6,1,'#3a2a1a');q(0,6+dy,1,3,K.col);q(7,6+dy,1,3,K.col);
  q(1,1+dy,6,4,r.skin);q(2,3+dy,1,1,'#111');q(5,3+dy,1,1,'#111');q(1,0+dy,6,1,r.hair);q(0,1+dy,1,2,r.hair);q(7,1+dy,1,2,r.hair);
  if(r.beard)q(1,4+dy,6,2,r.hair);if(r.tusks){q(2,4+dy,1,1,'#fff');q(5,4+dy,1,1,'#fff');}if(r.ears){q(-1,2+dy,1,1,r.skin);q(8,2+dy,1,1,r.skin);}
  const sw=C.anim.hero>0?-2:0;
  if(h.cls==='hunter'){q(8,1+dy,1,1,'#8a5a2b');q(9,2+dy,1,6,'#8a5a2b');q(8,8+dy,1,1,'#8a5a2b');q(8,2+dy,1,6,'#e8e4d4');}
  else if(h.cls==='warrior'||h.cls==='rogue'){q(8,2+dy+sw,1,6,'#dfe6ee');q(7,7+dy,3,1,'#8a5a2b');}else{q(8,-1+dy,1,11,'#8a5a2b');q(7,-2+dy,3,2,h.cls==='mage'?'#69ccf0':'#f2c14e');}
  if(h.cls==='warrior')q(-1,5+dy,2,4,'#9aa5b5');
  if(C.cast){g.globalAlpha=.5+.3*Math.sin(t*12);g.fillStyle=h.cls==='mage'?'#ff9a3a':'#fff0a0';g.beginPath();g.arc(x+9*p,y-1*p,p*2.2,0,7);g.fill();}
  g.globalAlpha=1;}
function drawMob(m,x,y,p,t,g){g=g||cx;const sc=m.elite?1.45:1;p*=sc;const q=(gx,gy,w,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+gx*p),Math.round(y+gy*p),Math.ceil(w*p),Math.ceil(hh*p));};
  const c=m.col,b=reduce?0:(Math.sin(t*5)>0?1:0);
  if(m.kind==='beast')drawBeast(g,x,y,p,c,m.fam||'wolf',false,t);
  else{q(0,0,5,4,c);q(1,2,1,1,'#ff4a3a');q(3,2,1,1,'#ff4a3a');q(-1,4,7,6,c);q(-2,4,1,4,c);q(6,4,1,4,c);q(0,10,2,3+b,c);q(3,10,2,3-b,c);q(-3,1,1,8,'#7a5a3a');}
  if(m.elite){g.strokeStyle='#f2c14e';g.lineWidth=2;g.strokeRect(x-6*p,y-2*p,18*p,17*p);}}
/* Companions and other adventurers */
function drawPerson(x,y,p,o,t,g){g=g||cx;if(o.dir)return drawFacingPerson(x,y,p,o,t,g);const r=RACES[o.race],K=CLASSES[o.cls];const q=(gx,gy,w,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+gx*p),Math.round(y+gy*p),Math.ceil(w*p),Math.ceil(hh*p));};
  if(o.dead)g.globalAlpha=.3;const b=!reduce&&!o.dead&&Math.sin(t*6)>0?1:0;
  q(2,10,1,3,'#2b2b3a');q(5,10,1,3,'#2b2b3a');q(1,5-b*.2,6,5,K.col);q(1,9,6,1,'#3a2a1a');q(0,6,1,3,K.col);q(7,6,1,3,K.col);
  q(1,1,6,4,r.skin);q(2,3,1,1,'#111');q(5,3,1,1,'#111');q(1,0,6,1,o.hair);q(0,1,1,2,o.hair);q(7,1,1,2,o.hair);if(r.tusks){q(2,4,1,1,'#fff');q(5,4,1,1,'#fff');}if(r.ears){q(-1,2,1,1,r.skin);q(8,2,1,1,r.skin);}
  if(o.cls==='warrior'){q(-1,5,2,4,'#9aa5b5');q(8,2,1,6,'#dfe6ee');}else if(o.cls==='rogue')q(8,6,2,1,'#dfe6ee');else if(o.cls==='hunter'){q(9,2,1,6,'#8a5a2b');q(8,2,1,6,'#e8e4d4');}
  else{q(8,-1,1,11,'#8a5a2b');q(7,-2,3,2,o.cls==='mage'?'#69ccf0':'#f2c14e');}
  g.globalAlpha=1;}
/* Four views for walkers; combat keeps its existing presentation. No pose is saved. */
function drawFacingPerson(x,y,p,o,t,g){
 g=g||cx;const r=RACES[o.race],K=CLASSES[o.cls],dir=o.dir||'down',side=dir==='left'||dir==='right',back=dir==='up',hair=o.hair||r.hair;
 const stride=!reduce&&o.moving&&!o.dead?(Math.sin(t*9)>0?1:-1):0;
 const q=(a,b,w,h,col)=>{g.fillStyle=col;const xx=dir==='left'?8-a-w:a;g.fillRect(Math.round(x+xx*p),Math.round(y+b*p),Math.ceil(w*p),Math.ceil(h*p));};
 g.save();if(o.dead)g.globalAlpha*=.3;
 for(const [a,phase]of side?[[3,1],[5,-1]]:[[2,1],[5,-1]]){const lift=stride===phase?1:0;q(a,10,1,3-lift,'#353540');q(a-.2,12-lift,1.5,1,'#49382b');}
 q(side?2:1,5,side?4:6,5,K.col);q(side?2:1,9,side?4:6,1,'#49382b');q(side?2:1,5,1,4,'rgba(0,0,0,.22)');
 if(side){q(3,6+stride*.4,1,3,K.col);q(3,8+stride*.4,1,1,r.skin);}
 else{q(0,6+stride*.4,1,3,K.col);q(7,6-stride*.4,1,3,K.col);q(0,8+stride*.4,1,1,r.skin);q(7,8-stride*.4,1,1,r.skin);}
 if(back){q(1,0,6,4,hair);q(0,1,1,3,hair);q(7,1,1,3,hair);q(2,4,4,1,r.skin);q(2,5,4,1,'rgba(0,0,0,.2)');}
 else if(side){q(3,1,3,4,r.skin);q(6,2,1,2,r.skin);q(5,2,1,1,'#111');q(2,0,4,1,hair);q(2,1,2,3,hair);q(3,2,1,1,r.skin);if(r.beard)q(4,4,3,1,hair);if(r.tusks)q(6,4,1,1,'#fff');}
 else{q(1,1,6,4,r.skin);q(2,3,1,1,'#111');q(5,3,1,1,'#111');q(1,0,6,1,hair);q(0,1,1,2,hair);q(7,1,1,2,hair);if(r.beard)q(1,4,6,1,hair);if(r.tusks){q(2,4,1,1,'#fff');q(5,4,1,1,'#fff');}}
 if(r.ears){if(side)q(2,2,1,1,r.skin);else{q(-1,2,1,1,r.skin);q(8,2,1,1,r.skin);}}
 if(back)q(2,6,4,.5,'rgba(255,255,255,.18)');
 if(o.cls==='warrior'){q(side?1:-1,5,2,4,'#8895a8');q(side?6:8,2,1,6,'#dfe6ee');q(side?5:7,7,3,.6,'#8a5a2b');}
 else if(o.cls==='rogue')q(side?6:8,7,2,.7,'#dfe6ee');
 else if(o.cls==='hunter'){q(side?6:9,2,1,6,'#8a5a2b');q(side?5:8,2,.5,6,'#e8e4d4');}
 else{q(side?6:8,-1,1,11,'#8a5a2b');q(side?5:7,-2,3,2,o.cls==='mage'?'#69ccf0':'#f2c14e');}
 g.restore();
}
const REALM_ROOM_ZOOM=6.2;
/* Side walls are planes joined at shared corners, not front-facing tile billboards. */
function realmSideWallPoints(x,y,room,height){
 const yh=PH*room.horizon,F=PH/REALM_ROOM_ZOOM*4.2,K=(PH*.8-yh)*4.2,wx=x===0?1:room.rows[0].length-1;
 const at=(wy,h)=>{const d=4.2+room.pos.y+.5-wy;if(d<.45)return null;const s=F/d;return [PW/2+(wx-room.pos.x-.5)*s,yh+K/d-h*s];};
 const points=[at(y,height),at(y+1,height),at(y+1,0),at(y,0)];return points.every(Boolean)?points:null;
}
function drawRoomSideWall(g,x,y,room){
 const points=realmSideWallPoints(x,y,room,1.75);if(!points)return;
 const face=(ps,col)=>{g.fillStyle=col;g.beginPath();ps.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();};
 g.save();face(points,TOWN.pal.woodDk);
 for(const h of [.12,.8,1.65]){const band=realmSideWallPoints(x,y,room,h),top=realmSideWallPoints(x,y,room,h+.06);if(band&&top)face([top[0],top[1],band[1],band[0]],'#3a2414');}
 g.restore();
}
/* One beast drawer for wild beasts, pets and portraits. Faces left unless right=true. */
function drawBeast(c,x,y,p,col,fam,right,t){
  c.save();c.translate(x,y);if(right){c.translate(6*p,0);c.scale(-1,1);}
  const q=(gx,gy,w,hh,cc)=>{c.fillStyle=cc;c.fillRect(Math.round(gx*p),Math.round(gy*p),Math.ceil(w*p),Math.ceil(hh*p));};
  const b=t&&!reduce?(Math.sin(t*5)>0?1:0):0,dk='#111';
  switch(fam){
    case 'spider':q(0,6,8,5,col);q(-3,5,4,4,col);q(-3,6,1,1,'#ff3a3a');q(-1,6,1,1,'#ff3a3a');for(let i=0;i<4;i++){q(-1+i*2.5,11,1,2+((i+b)%2),col);q(-2+i*2.5,4,1,2,col);}break;
    case 'lizard':case 'croc':{const L=fam==='croc'?14:11;q(-1,8,L-3,3,col);q(-5,8,4,2,col);q(-5,8,1,1,dk);q(-3,8,1,1,'#ffde55');q(L-4,9,4,1,col);q(0,11,1,2-b,col);q(L-6,11,1,1+b,col);if(fam==='croc')q(-6,9,2,1,'#e8e4d4');break;}
    case 'horse':{const mn='rgba(0,0,0,.45)';q(-1,5,11,5,col);q(-3,1,3,6,col);q(-6,1,4,3,col);q(-6,2,1,1,dk);q(-7,3,1,1,col);q(-2,0,2,1,col);
      q(-1,1,1,5,mn);q(10,5,2,6,mn);q(0,10,1,5-b,col);q(2,10,1,5,col);q(7,10,1,5,col);q(9,10,1,5+b-1,col);q(0,14,1,1,dk);q(9,14,1,1,dk);break;}
    case 'boar':q(-1,5,10,5,col);q(-4,6,4,4,col);q(-5,8,1,1,'#e8e4d4');q(-4,7,1,1,'#ffde55');q(0,10,1,3-b,col);q(7,10,1,2+b,col);q(2,10,1,3,col);q(5,10,1,3,col);q(0,4,6,1,'rgba(0,0,0,.35)');break;
    default:q(-1,6,10,4,col);q(-4,4+b*.3,4,4,col);q(-4,3,1,1,col);q(-2,3,1,1,col);q(-5,5,1,1,dk);q(-4,5,1,1,'#ffde55');q(0,10,1,3-b,col);q(7,10,1,2+b,col);q(2,10,1,3,col);q(5,10,1,3,col);
      if(fam==='cat'){q(9,5,1,1,col);q(10,3,1,3,col);}else if(fam==='hyena'){q(2,7,1,1,dk);q(5,8,1,1,dk);q(9,6,2,1,col);}else q(9,5,2,1,col);
  }
  c.restore();
}
function frame(ms){requestAnimationFrame(frame);if(!PW||!H()||!C||document.hidden)return;const t=ms/1000;if(typeof realmRoadActive==='function'&&realmRoadActive()){drawRealmRoad(t);return;}if(townActive()){drawTown(t);return;}TOWN.on=false;TOWN.last=null;const h=H(),z=h.dun?dungeonDef():ZONES[h.zone];
  const gy=Math.min(PH*.78,PH-(PW<700?230:155)),p=Math.max(2,Math.floor(Math.min(PH,Math.max(240,PW*.7),600)/42));const AMBS=ambBack(t,gy,p); // sky, scenery, ground, torches, campfire (20-ambience.js)
  if(C.phase==='intown'||C.phase==='town')ambTown(gy,t,AMBS);
  AMBS.sun=realmSun();realmShadows(gy,p,t,AMBS.sun,AMBS.lights); // real shadows along the sun, or away from the fire (23-light.js)
  const walk=(C.phase==='seek'||C.phase==='town')&&!reduce?Math.sin(t*8)*p*.6:0;
  const lunge=C.anim.hero>0?p*3:0;
  const ride=!h.dun&&(C.phase==='seek'||C.phase==='town')?activeMount():null;
  if(ride){const mp=Math.max(2,Math.round(p*(ride.kind==='horse'?1:1.1)));const bottom=ride.kind==='horse'?15:ride.kind==='lizard'||ride.kind==='croc'?13:13;
    const back={horse:5,boar:5,lizard:8,croc:8}[ride.kind]||6;const gallop=reduce?0:Math.abs(Math.sin(t*10))*p*.3;const by=gy-bottom*mp-gallop;
    drawBeast(cx,PW*.28-2*p,by,mp,ride.col,ride.kind,true,t*1.8);drawHero(PW*.28,by+back*mp-10.5*p,p,t);}
  else drawHero(PW*.28+lunge,gy-13*p+walk,p,t);
  const pet=petOf();if(pet&&C.phase!=='dead'&&!(ride&&ride.pet)){const pp=Math.max(2,Math.round(p*.8));cx.globalAlpha=pet.hp>0?1:.35;
    drawBeast(cx,PW*.4+(C.anim.pet>0?pp*3:0),gy-13*pp+(walk?walk*.6:0),pp,pet.col,pet.family,true,pet.hp>0?t:0);cx.globalAlpha=1;
    if(C.taming&&C.mob){cx.strokeStyle='rgba(124,240,138,.8)';cx.setLineDash([4,4]);cx.beginPath();cx.moveTo(PW*.3+8*p,gy-8*p);cx.lineTo(PW*.64,gy-8*p);cx.stroke();cx.setLineDash([]);}}
  else if(C.taming&&C.mob){cx.strokeStyle='rgba(124,240,138,.8)';cx.setLineDash([4,4]);cx.beginPath();cx.moveTo(PW*.3+8*p,gy-8*p);cx.lineTo(PW*.64,gy-8*p);cx.stroke();cx.setLineDash([]);}
  if(C.mob){const m=C.mob;const mx=PW*.64+(C.anim.mob<0?-p*3:0)+(C.anim.mob>0&&!reduce?(R()-.5)*p*2:0);drawMob(m,mx,gy-13*p*(m.elite?1.45:1),p,t);
    const c=con(m.lvl);cx.font=`700 ${Math.max(11,p*4)}px Alegreya Sans, sans-serif`;cx.textAlign='center';cx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--con-'+c);cx.fillText(`${m.name}`,mx+3*p,gy-17*p*(m.elite?1.45:1));
    cx.fillStyle='#000';cx.fillRect(mx-6*p,gy-16*p*(m.elite?1.45:1),18*p,p*1.4);cx.fillStyle='#d33';cx.fillRect(mx-6*p,gy-16*p*(m.elite?1.45:1),18*p*Math.max(0,m.hp/m.max),p*1.4);}
  // companions stand behind you
  C.party.forEach((q,i)=>{const pp=Math.max(2,Math.round(p*.85));const x=PW*.28-(i+1)*PW*(C.party.length>4?.027:.065),y=gy-13*pp+((i%2)?pp:0)-(C.party.length>4&&i%2?3*pp:0)+(walk?walk*.5:0);
    drawPerson(x,y,pp,{cls:q.n.cls,race:q.n.race,hair:q.n.hair,dead:q.dead||C.phase==='dead'},t+i);});
  ambFront(t,gy,p,AMBS); // weather, night and lightning
  if(C.surge&&C.mob){cx.font=`800 ${p*5}px Alegreya Sans, sans-serif`;cx.textAlign='center';cx.fillStyle='#ff8a2a';cx.fillText(dungeonDef().surgeName.toUpperCase(),PW*.66,gy-22*p);
    cx.fillStyle='rgba(60,140,220,.25)';cx.fillRect(PW*.1,gy-4*p,PW*.6*(1-C.surge.t/2.5),4*p);cx.textAlign='left';}
  if(C.phase==='rest'&&!reduce){cx.fillStyle='#fff';cx.font=`700 ${p*4}px Alegreya Sans, sans-serif`;cx.fillText('z',PW*.28+10*p,gy-16*p-(Math.floor(t*2)%3)*p*2);}
  cx.textAlign='center';
  for(let i=C.fx.length-1;i>=0;i--){const f=C.fx[i];f.age+=1/60;if(f.age>1.1||reduce){C.fx.splice(i,1);continue;}const x=(f.who==='mob'?PW*.66:f.who==='pet'?PW*.43:PW*.3)+(f.x-.5)*PW*.08,y=gy-20*p-f.age*p*10;
    cx.globalAlpha=1-f.age/1.1;cx.font=`800 ${f.big?p*7:p*5}px Alegreya Sans, sans-serif`;cx.lineWidth=3;cx.strokeStyle='#000';cx.strokeText(f.txt,x,y);cx.fillStyle=f.col;cx.fillText(f.txt,x,y);}
  cx.globalAlpha=1;cx.textAlign='left';}

