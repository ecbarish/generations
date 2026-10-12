'use strict';
/* Original code-drawn art. Two CSS pixels per canvas pixel; the world grows with the window.
   Late sunlight from the left, cool shade on the right, warm field lights and grounded contact shadows. */
const world=document.querySelector('#world'), ctx=world.getContext('2d'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function polygon(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function glow(x,y,r,c){const a=ctx.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,c);a.addColorStop(1,'transparent');ctx.fillStyle=a;ctx.fillRect(x-r,y-r,r*2,r*2);}
function person(x,y,k,shirt,skin,pose=0,face='front',cap=true){
  ellipse(x+k,y+k,5*k,1.5*k,'#0b272759');
  polygon([[x-2*k,y],[x+10*k,y+3*k],[x+7*k,y+5*k],[x-4*k,y+2*k]],'#153e3a40');
  rect(x-3*k,y-9*k,6*k,6*k,shirt);rect(x-2*k,y-14*k,4*k,5*k,skin);
  if(cap){rect(x-3*k,y-15*k,6*k,2*k,'#143e49');rect(x+(face==='side'?1:-3)*k,y-13*k,4*k,k,'#143e49');}
  if(face!=='back')rect(x+(face==='side'?1:-1)*k,y-11*k,k,k,'#1e2831');
  rect(x-3*k,y-3*k,2*k,3*k+pose,'#e1dac3');rect(x+k,y-3*k,2*k,3*k-pose,'#e1dac3');
  rect(x-4*k,y-8*k,k,5*k,skin);rect(x+3*k,y-8*k,k,5*k,skin);
}
function drawBallpark(t,w,h){
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#40596d');sky.addColorStop(.3,'#dda772');sky.addColorStop(.5,'#d2b083');sky.addColorStop(.51,'#416a47');sky.addColorStop(1,'#235343');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  glow(w*.12,h*.20,h*.3,'#ffc99455');
  // Skyline and flag, then terraces packed with little individual spectators.
  for(let i=0;i<w/22;i++){const height=12+(i*37%22);rect(i*22,h*.30-height,18,height,'#344d5966');}
  for(let row=0;row<4;row++){
    const y=h*.33+row*8;rect(0,y,w,7,row%2?'#48565a':'#3c4a52');
    for(let x=8;x<w;x+=11){const q=Math.floor(x/11)+row*13;const bob=!reduced&&Math.sin(t*1.6+q)>0.97?-1:0;rect(x,y+1+bob,2,2,['#e6b68b','#b67c59','#8d5d43'][q%3]);rect(x-1,y+3+bob,4,3,['#3f7b80','#c26f50','#d4bd79','#5d7669'][q%4]);}
  }
  rect(0,h*.33+34,w,5,'#172f38');rect(0,h*.33+39,w,3,'#d3b778');
  const plate=[w*.5,h*.87],left=[w*.17,h*.60],second=[w*.5,h*.37+42],right=[w*.83,h*.60];
  // Mowing bands widen towards the player. Dugouts and pennants fill even an ultrawide field.
  for(let j=0;j<9;j++)polygon([[0,h*.47+j*h*.061],[w,h*.47+j*h*.061],[w,h*.49+j*h*.061],[0,h*.49+j*h*.061]],'#44774a40');
  polygon([plate,left,second,right],'#b78857');
  polygon([[plate[0],plate[1]-h*.065],[left[0]+w*.07,left[1]],[second[0],second[1]+h*.055],[right[0]-w*.07,right[1]]],'#4b7548');
  // Chalk paths converge at home plate.
  ctx.strokeStyle='#ecdec099';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.03,h*.47);ctx.lineTo(...plate);ctx.lineTo(w*.97,h*.47);ctx.stroke();
  [plate,left,second,right].forEach(([x,y])=>polygon([[x,y-3],[x+4,y],[x,y+3],[x-4,y]],'#fff0cf'));
  const mound=[w*.5,h*.58];ellipse(...mound,w*.045,h*.028,'#c9a16e');rect(mound[0]-4,mound[1]-1,8,2,'#f9ebcc');
  // Players guard their places; occupied bases acquire an extra runner.
  const k=clamp(h/160,1,3),g=S.active&&S.active.g;
  person(left[0]+10,left[1]-4,k*.72,'#a7594b','#d49d76',0,'side');person(right[0]-10,right[1]-5,k*.72,'#a7594b','#bb7d55',0,'side');
  person(second[0]+w*.12,second[1]+10,k*.55,'#a7594b','#d49d76',0,'front');
  for(let i=0;i<3;i++)if(g&&g.bases[i]){const [x,y]=[right,second,left][i];person(x-5,y+6,k*.65,'#bce0cc','#dba572',0,'back');}
  const throwing=pitchClock.running&&pitchClock.elapsed<(S.active?.pitch?.duration||1)*.15;
  person(mound[0],mound[1],k*.9,'#a7594b','#dca880',throwing?k:0,'front');
  if(throwing)rect(mound[0]+3*k,mound[1]-17*k,k,8*k,'#dca880');
  const skin=DC.looks[S.player?.look||0].skin,side=S.player?.bats==='left'?1:-1,bx=plate[0]+side*10*k,by=plate[1];
  person(bx,by,k,'#bce0cc',skin,0,'side');
  const swing=S.phase==='result'&&!S.active.last.take;
  ctx.save();ctx.translate(bx+side*3*k,by-8*k);ctx.rotate(swing?side*1.25:side*-.35);rect(-k,-12*k,k*1.5,13*k,'#e4bf7c');ctx.restore();
  person(plate[0],plate[1]+10*k,k*.75,'#223442','#ba7c56',0,'back');
  // The circle at the plate: faint while the ball comes in, bright in the moment to swing.
  if(pitchClock.running&&S.active?.pitch&&S.mode==='timing'){const f=pitchClock.elapsed/S.active.pitch.duration,now=Math.abs(f-1)<swingWindow(S);ctx.strokeStyle=now?'#fff1b0':'#fff1b055';ctx.lineWidth=now?2:1;ctx.beginPath();ctx.ellipse(plate[0],plate[1]-2*k,(now?9:7)*k,(now?4:3)*k,0,0,Math.PI*2);ctx.stroke();if(now)glow(plate[0],plate[1]-2*k,14*k,'#fff1b055');}
  if(pitchClock.running&&S.active?.pitch){const f=clamp(pitchClock.elapsed/S.active.pitch.duration,0,swingWindow(S)>.10?1:1.13);const arc=S.active.pitch.type==='curve'?Math.sin(f*Math.PI)*w*.06:0;const x=mound[0]+arc,y=mound[1]-10*k+(plate[1]-mound[1]+10*k)*f;ellipse(x,y,1.5+f*2,1.5+f*2,'#fff9df');}
  if(S.phase==='result'&&typeof S.active.last.play==='number'){
    const f=reduced?1:clamp((performance.now()-contactAt)/650,0,1),bases=S.active.last.play;
    const tx=w*(bases===1?.72:bases===2?.18:bases===3?.88:.57),ty=h*(bases===4?.29:.45);
    const x=plate[0]+(tx-plate[0])*f,y=plate[1]+(ty-plate[1])*f-Math.sin(f*Math.PI)*h*.08;
    ellipse(x,y,2,2,'#fff9df');
  }
  for(const side of [-1,1]){const x=w*.5+side*w*.40;rect(x-14,h*.78,28,12,'#283f42');rect(x-18,h*.77,36,4,'#b08d63');rect(x-12,h*.80,24,3,'#817e66');}
  for(const x of [w*.09,w*.91]){rect(x,h*.12,2,h*.31,'#344753');rect(x-10,h*.12,22,5,'#283741');for(let i=0;i<4;i++)rect(x-8+i*5,h*.12+1,3,3,'#ffedc6');glow(x,h*.14,h*.2,'#ffe8b522');polygon([[x-10,h*.15],[x+10,h*.15],[x+w*.10,h*.63],[x-w*.12,h*.63]],'#fff3bd09');}
  rect(w*.08,h*.27,1,20,'#7a6950');polygon([[w*.08+1,h*.27],[w*.08+17,h*.27+(reduced?0:Math.sin(t)*2)],[w*.08+17,h*.27+8],[w*.08+1,h*.27+7]],'#c5d5b4');
}
function drawHome(t,w,h){
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#465971');sky.addColorStop(.65,'#ba927c');sky.addColorStop(1,'#334a43');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  rect(0,h*.75,w,h*.25,'#273f3c');rect(0,h*.90,w,h*.10,'#162c31');
  const apartment=S.owned.apartment, x=w*.12, y=h*.24, rw=w*.42,rh=h*.51;
  // The room is a cutaway: the first purchase visibly brings warm windows, a sofa and a hanging shirt.
  rect(x,y,rw,rh,apartment?'#d6bb8a':'#82988c');rect(x+3,y+3,rw-6,rh-6,apartment?'#9b886c':'#536a65');
  rect(x+4,y+rh*.69,rw-8,rh*.3,apartment?'#ab7b4e':'#596559');
  rect(x+rw*.1,y+rh*.13,rw*.25,rh*.32,'#2b4558');rect(x+rw*.11,y+rh*.14,rw*.23,rh*.30,apartment?'#e9c989':'#799b9c');
  rect(x+rw*.22,y+rh*.14,2,rh*.30,'#d5b47d');rect(x+rw*.11,y+rh*.28,rw*.23,2,'#d5b47d');
  polygon([[x+rw*.1,y+rh*.45],[x+rw*.35,y+rh*.45],[x+rw*.66,y+rh*.88],[x+rw*.29,y+rh*.88]],apartment?'#ffdc7440':'#c7e0ce15');
  if(apartment){rect(x+rw*.10,y+rh*.60,rw*.40,rh*.15,'#4c7c74');rect(x+rw*.10,y+rh*.73,rw*.40,rh*.08,'#315954');rect(x+rw*.14,y+rh*.64,rw*.14,rh*.1,'#a9bd90');rect(x+rw*.65,y+rh*.18,rw*.14,rh*.25,'#234a50');rect(x+rw*.68,y+rh*.20,rw*.08,rh*.17,'#c3e0c7');rect(x+rw*.70,y+rh*.23,3,5,'#f5d189');}
  else {rect(x+rw*.15,y+rh*.74,rw*.45,rh*.04,'#b3ac94');rect(x+rw*.15,y+rh*.79,rw*.45,rh*.10,'#777d6a');rect(x+rw*.16,y+rh*.70,rw*.12,rh*.04,'#c2bba7');}
  const lamp=x+rw*.84;rect(lamp,y+rh*.50,2,rh*.31,'#685544');rect(lamp-7,y+rh*.49,16,6,'#f4d28c');glow(lamp,y+rh*.56,rh*.4,'#ffe0a02a');
  const gx=w*.62,gy=h*.38,gw=w*.29,gh=h*.37;
  rect(gx-3,gy-5,gw+6,gh+5,'#8c7668');rect(gx,gy,gw,gh,'#22393d');rect(gx,gy+gh*.9,gw,gh*.1,'#546759');
  if(S.owned.car){const cy=gy+gh*.70;ellipse(gx+gw*.5,cy+gh*.12,gw*.40,gh*.10,'#0c242bcc');polygon([[gx+gw*.12,cy],[gx+gw*.25,cy-gh*.17],[gx+gw*.70,cy-gh*.17],[gx+gw*.87,cy],[gx+gw*.90,cy+gh*.14],[gx+gw*.1,cy+gh*.14]],'#4da19c');rect(gx+gw*.28,cy-gh*.14,gw*.16,gh*.12,'#b6cddd');rect(gx+gw*.49,cy-gh*.14,gw*.19,gh*.12,'#8ea8bb');for(const xx of [gx+gw*.25,gx+gw*.76]){ellipse(xx,cy+gh*.13,gh*.09,gh*.09,'#17292f');ellipse(xx,cy+gh*.13,gh*.035,gh*.035,'#9a9c96');}rect(gx+gw*.85,cy,gw*.04,gh*.06,'#f4d794');}
  else {rect(gx+gw*.22,gy+gh*.7,gw*.2,gh*.21,'#947856');rect(gx+gw*.52,gy+gh*.75,gw*.2,gh*.16,'#7c684d');}
  person(x+rw*.70,y+rh*.85,clamp(h/120,1.3,3.5),'#bce0cc',DC.looks[S.player?.look||0].skin,0,'front',false);
  for(let i=0;i<5;i++){rect(w*.04+i*w*.20,h*.76,1,h*.14,'#514c3d');rect(w*.04+i*w*.20-3,h*.76-3,8,6,'#eadb9c');glow(w*.04+i*w*.20,h*.80,h*.06,'#ffd38218');}
}
function drawClubhouse(t,w,h){
  rect(0,0,w,h,'#314f52');rect(0,h*.72,w,h*.28,'#7c694e');
  // A room around the player: lockers, a lit coach's desk, boots and a bench.
  for(let x=20,i=0;x<w-15;x+=46,i++){
    rect(x,h*.30,38,h*.41,'#406b65');rect(x+2,h*.30+2,34,h*.4-4,'#3a605c');
    for(let j=0;j<3;j++)rect(x+8,h*.34+j*4,20,1,'#193f43');
    rect(x+29,h*.5,3,8,'#dcc693');rect(x+12,h*.57,14,18,i%3?'#c7ddc8':'#e1b967');
    rect(x+17,h*.60,3,6,'#1d474b');ellipse(x+19,h*.75,15,3,'#18373955');rect(x+9,h*.73,8,4,'#253941');rect(x+22,h*.73,8,4,'#253941');
  }
  rect(w*.09,h*.81,w*.58,5,'#c39968');for(const x of [w*.14,w*.62])rect(x,h*.82,3,h*.08,'#745637');
  const desk=w*.77;rect(desk,h*.68,w*.16,5,'#d7aa70');rect(desk+3,h*.70,3,h*.2,'#755a44');rect(desk+w*.14,h*.70,3,h*.2,'#755a44');rect(desk+5,h*.65,w*.07,5,'#e1d7b2');rect(desk+w*.1,h*.56,2,h*.12,'#8c7859');rect(desk+w*.1-6,h*.55,14,5,'#ffdc91');glow(desk+w*.1,h*.60,h*.27,'#ffe5a333');
  const k=clamp(h/150,1.5,3.5);person(w*.43,h*.83,k,'#bce0cc',DC.looks[S.player?.look||0].skin,0,'front');person(w*.81,h*.84,k,'#3c7b72','#bb7850',0,'front',false);
  polygon([[0,h*.09],[w*.15,h*.09],[w*.42,h*.8],[w*.20,h*.8]],'#eacfa816');
}
let previousFrame=0;
function animateWorld(now){
  const dt=Math.min(80,previousFrame?now-previousFrame:0);previousFrame=now;
  const paused=document.hidden||sceneState||careerSheet||document.querySelector('#save-dialog').open||!!document.querySelector('.arc-set-bg:not([hidden])');
  if(pitchClock.running&&!paused&&S.phase==='pitch'){
    pitchClock.elapsed+=dt;
    if(pitchClock.elapsed>S.active.pitch.duration*Math.max(1.14,1+swingWindow(S)))actCareer('take');
  }
  const w=Math.max(180,Math.ceil(world.clientWidth/2)),h=Math.max(130,Math.ceil(world.clientHeight/2));
  if(world.width!==w||world.height!==h){world.width=w;world.height=h;ctx.imageSmoothingEnabled=false;}
  const t=reduced?0:now/1000;
  drawCareerWorld(t,w,h);
  const bar=document.querySelector('#timing-bar span');bar.style.width=(S.active?.pitch?clamp(pitchClock.elapsed/S.active.pitch.duration/(1+swingWindow(S))*100,0,100):0)+'%';
  requestAnimationFrame(animateWorld);
}

/* Distinct authored away skylines, without changing the diamond or pitch trajectory. */
function drawAwaySky(t,w,h,town) {
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,h*.30);ctx.clip();
  const sky=ctx.createLinearGradient(0,0,0,h*.30);sky.addColorStop(0,town.kind==='sea'?'#658a9c':town.kind==='mountain'?'#455976':'#7b6461');sky.addColorStop(1,'#efc592');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h*.30);
  glow(w*.16,h*.16,h*.22,'#ffe4a044');
  if(town.kind==='sea'){
    rect(0,h*.21,w,h*.1,'#407d88');
    for(let i=0;i<10;i++)rect((i*w*.12+(reduced?0:t*3))%w,h*(.23+(i%3)*.02),w*.06,1,'#a7cec677');
    rect(w*.78,h*.12,w*.025,h*.15,'#d1c6ab');rect(w*.777,h*.14,w*.031,h*.015,'#a76550');rect(w*.774,h*.11,w*.04,h*.015,'#514d4f');glow(w*.79,h*.115,h*.08,'#ffe1a044');
    for(let i=0;i<3;i++)polygon([[w*(.3+i*.15),h*.21],[w*(.33+i*.15),h*.17],[w*(.34+i*.15),h*.21]],'#e6dac0');
  }else if(town.kind==='mountain'){
    for(let i=0;i<6;i++){const x=i*w*.2;polygon([[x-w*.1,h*.30],[x+w*.12,h*(.08+(i%2)*.04)],[x+w*.35,h*.30]],i%2?'#667a80':'#536778');polygon([[x+w*.07,h*.14],[x+w*.12,h*(.08+(i%2)*.04)],[x+w*.20,h*.17]],'#ded9c9');}
    for(let x=8;x<w;x+=23){rect(x,h*.25,2,h*.05,'#405447');polygon([[x-6,h*.27],[x+1,h*.20],[x+8,h*.27]],'#36534b');}
  }else{
    for(let i=0;i<w/38;i++){const x=i*38,y=h*.1+(i%3)*9;rect(x,y,33,h*.30-y,['#8f6253','#6e514b','#a2745c'][i%3]);for(let yy=y+7;yy<h*.28;yy+=10)for(let xx=x+5;xx<x+30;xx+=9)rect(xx,yy,4,5,(i+xx)%3?'#d9ad77':'#3c5358');rect(x-2,y-3,37,3,'#493f40');}
  }
  ctx.restore();
}
function drawTeamBus(t,w,h) {
  rect(0,0,w,h,'#31474d');rect(0,h*.65,w,h*.35,'#273639');
  for(let i=0;i<4;i++){const x=w*(.06+i*.25),y=h*.15,rw=w*.20,rh=h*.35;
    rect(x-3,y-3,rw+6,rh+6,'#182f38');rect(x,y,rw,rh,'#97bdc0');
    for(let j=0;j<6;j++){const xx=x+((j*43+(reduced?0:t*14))%rw);polygon([[xx-9,y+rh],[xx,y+rh*.7],[xx+12,y+rh]],'#618578');}
    rect(x,y+rh*.8,rw,rh*.2,'#b5a27e');rect(x+rw*.15,h*.53,rw*.65,h*.25,'#4f7972');rect(x+rw*.12,h*.74,rw*.7,h*.05,'#304d4c');
    person(x+rw*.45,h*.61,clamp(h/150,1.5,3),'#bce0cc',DC.looks[i].skin,0,'front',false);
  }
  rect(w*.44,h*.66,w*.12,h*.08,'#937955');rect(w*.47,h*.65,10,5,'#dfdbc7');rect(w*.50,h*.64,9,5,'#e8d2a6');
  glow(w*.5,h*.12,h*.4,'#ffe2aa20');
}
function drawCareerWorld(t,w,h) {
  if(careerRoom==='bus'&&sceneState){drawTeamBus(t,w,h);return;}
  const playing=['pitch','result','summary'].includes(S.phase);
  if(playing){drawBallpark(t,w,h);if(S.road)drawAwaySky(t,w,h,ROAD_TOWNS[S.road.index]);return;}
  if(S.contract&&careerRoom==='home')drawHome(t,w,h);else drawClubhouse(t,w,h);
  // The same objects the player opens: calendar, locker contract, notebook, pay envelope.
  const home=S.contract&&careerRoom==='home',x=w*(home?.46:.53),y=h*(home?.24:.13),cw=w*.07,ch=h*.13;
  rect(x,y,cw,ch,'#ddcba7');rect(x,y,cw,ch*.2,'#995e48');
  for(let row=0;row<3;row++)for(let col=0;col<5;col++)rect(x+cw*(.08+col*.17),y+ch*(.32+row*.20),cw*.10,ch*.09,'#766452');
  rect(x+cw*.05,y+ch*.30,cw*.15,ch*.15,'#4a8177');
  if(!home){rect(w*.20,h*.43,w*.035,h*.08,'#e6d7b5');rect(w*.207,h*.445,w*.02,1,'#6b6150');rect(w*.207,h*.46,w*.02,1,'#6b6150');rect(w*.70,h*.65,w*.075,h*.025,'#6d9b91');rect(w*.707,h*.652,w*.06,1,'#cfddc9');}
  else {rect(w*.71,h*.50,w*.05,h*.025,'#e0c893');polygon([[w*.71,h*.50],[w*.735,h*.515],[w*.76,h*.50]],'#af9166');}
}