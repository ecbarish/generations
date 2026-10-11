/* RB1.8: real pixel output and rendering integration, in the save-isolated test iframe. */
function checkRealmFacing(frame){return frame.contentWindow.eval('('+function(){
 const checks=[],check=(ok,label)=>{if(!ok)throw Error('RB1.8: '+label);checks.push('RB1.8: '+label);};
 const canvas=document.createElement('canvas');canvas.width=240;canvas.height=200;const g=canvas.getContext('2d');
 const pixels=()=>g.getImageData(0,0,240,200).data;
 const image=(pose,t=0)=>{g.clearRect(0,0,240,200);drawPerson(80,50,6,pose,t,g);return Array.from(pixels());};
 for(const race of Object.keys(RACES))for(const cls of Object.keys(CLASSES)){
  const o={race,cls,hair:RACES[race].hair},views=['up','down','left','right'].map(dir=>image({...o,dir}));
  check(new Set(views.map(v=>v.join(','))).size===4,race+' '+cls+' has four distinct views');
 }
 const o={race:'human',cls:'warrior',hair:'#765432'};
 for(const dir of ['up','down','left','right']){
  const ops=[],old=g.fillRect;g.fillRect=function(...args){ops.push([this.fillStyle,...args]);return old.apply(this,args);};
  image({...o,dir});g.fillRect=old;
  const eyes=ops.filter(a=>a[0]==='#111111');check(eyes.length===(dir==='up'?0:dir==='down'?2:1),dir+' shows only the eyes visible from that direction');
  g.globalAlpha=.7;drawPerson(10,10,3,{...o,dir,dead:true},0,g);check(Math.abs(g.globalAlpha-.7)<.01,dir+' preserves caller opacity');g.globalAlpha=1;
 }
 const stepsMatch=image({...o,dir:'up',moving:true},.1).join(',')===image({...o,dir:'up',moving:true},.5).join(',');check(reduce?stepsMatch:!stepsMatch,'walking steps animate, or freeze with reduced motion');
 check(image({...o,dir:'up',moving:false},.1).join(',')===image({...o,dir:'up',moving:false},.5).join(','),'stationary people do not march in place');
 const quality=S.gfx;
 try{for(const q of ['low','high']){
  S.gfx=q;const st=LT.time(.125),render=(fork,from,state=st)=>{g.clearRect(0,0,240,200);REALM_WALK_LIGHT.cast(g,c=>{c.fillStyle='#fff';c.fillRect(100,20,6,70);if(!fork)c.fillRect(106,20,10,70);c.fillRect(116,20,6,70);},[98,18,26,74],90,state,from?{from,reach:240}:{});return Array.from(pixels());};
  const full=render(false),fork=render(true);check(fork.some((v,i)=>i%4===3&&v>0),q+' casts a visible silhouette');
  check(full.some((v,i)=>i%4===3&&v>fork[i]+5),q+' preserves a gap in the object silhouette instead of drawing an ellipse');
  const left=render(true,[20,40]),right=render(true,[220,40]);const centre=a=>{let total=0,sum=0;for(let i=3;i<a.length;i+=4){total+=a[i];sum+=((i-3)/4%240)*a[i];}return sum/total;};
  check(centre(left)>centre(right),q+' point-light shadow falls away from the light');check(centre(render(true,null,LT.time(.125)))>centre(render(true,null,LT.time(.375))),q+' sunlight shadow changes direction through the day');
  g.clearRect(0,0,240,200);REALM_WALK_LIGHT.contact(g,100,100,40,st);const a=pixels();let min=240,max=0;for(let i=3;i<a.length;i+=4)if(a[i]){const x=(i-3)/4%240;min=Math.min(min,x);max=Math.max(max,x);}check(max-min<30,q+' contact shadow stays close to the feet');
 }}finally{S.gfx=quality;}
 clearRealmRoad();clearTownService();closeRealmNotebook(false);RTALK=null;SCN.el.hidden=true;
 const h=newHero('Facingcheck','concord','human','warrior');h.mode='focus';h.onboarding={arrival:true,hints:{}};S.chars=[h];S.cur=h.id;boot();closeModal();clearArrival();C.phase='intown';townEnter();TOWN.on=true;
 const townDraw=TOWN_HD.draw,roadDraw=REALM_ROAD_HD.draw;let view;
 try{TOWN_HD.draw=function(c,w,hh,t,v){view=v;return townDraw.call(this,c,w,hh,t,v);};TOWN_WALK.place(13,14,'up');drawTown(0);check(view.lt===REALM_WALK_LIGHT&&view.lamps.length>0,'town uses silhouette shadows and its real light sources');
  const personDraw=drawPerson,heroDraw=drawHero;let face,heroPose;
  try{drawPerson=function(x,y,p,o,t,g){face=o.dir;};drawHero=function(x,y,p,t,g,pose){heroPose=pose;};view.things[0].draw(g,10,100,40);view.things[view.things.length-1].draw(g,10,100,40);check(face===townPeople()[0].dir&&heroPose.dir==='up','town passes NPC and hero facing to the renderer');}finally{drawPerson=personDraw;drawHero=heroDraw;}
  TOWN.inside=false;startRealmRoad();REALM_ROAD_HD.draw=function(c,w,hh,t,v){view=v;return roadDraw.call(this,c,w,hh,t,v);};drawRealmRoad(0);check(view.lt===REALM_WALK_LIGHT&&view.lamps.length>0,'road uses silhouettes with the inn and camp light sources');
 }finally{TOWN_HD.draw=townDraw;REALM_ROAD_HD.draw=roadDraw;clearRealmRoad();}
  const room={rows:SERVICE_ROOMS.inn.rows,pos:{x:7,y:8},horizon:.12};
 for(const x of [0,room.rows[0].length-1])for(let y=1;y<room.rows.length-2;y++){const a=realmSideWallPoints(x,y,room,1.75),b=realmSideWallPoints(x,y+1,room,1.75);check(a&&b&&a[1].every((v,i)=>Math.abs(v-b[0][i])<.001)&&a[2].every((v,i)=>Math.abs(v-b[3][i])<.001),'side '+x+' rows '+y+'/'+(y+1)+' share exact top and floor corners');}
 TOWN.inside='inn';TOWN_WALK.place(...SERVICE_ROOMS.inn.start);TOWN.on=true;
 for(const offset of [0,.25]){TOWN_WALK.fx=7+offset;TOWN_WALK.fy=8-offset;drawTown(0);const points=realmSideWallPoints(0,1,{rows:TOWN.map.rows,pos:{x:TOWN_WALK.fx,y:TOWN_WALK.fy},horizon:.12},1.75),floor=TOWN.cam.fwd(1,2);check(points[2].every((v,i)=>Math.abs(v-floor[i])<.001),'side-wall plane matches floor camera while moving '+offset);}TOWN_WALK.place(...SERVICE_ROOMS.inn.start);
 const fire=AMB.fire;let clipping=false,fireCalls=0;const clip=g.clip;g.clip=function(){clipping=true;return clip.apply(this,arguments);};
 try{AMB.fire=function(c,x,y,px,t,o){fireCalls++;check(clipping&&o.embers===false,'hearth flame is contained without escaping embers');return fire.call(this,c,x,y,px,t,o);};TOWN.pal=townPal();
  for(const [name,rows,y,start,end]of [['town',SERVICE_ROOMS.inn.rows,1,7,8],['road',REALM_ROAD_INN.rows,2,4,5]]){
   const s=48,u=s/8,left=80,base=160;
   for(const t of [0,.13,.5,1.7]){
    g.clearRect(0,0,240,200);clipping=false;const before=fireCalls;
    townStand(g,'H',left-s,base,s,t,start,y,undefined,rows);
    check(fireCalls===before,name+' hearth is drawn once for the two-tile footprint');
    townStand(g,'H',left,base,s,t,end,y,undefined,rows);
    const a=pixels();let minY=200,maxY=0,count=0,outside=false;
    for(let i=0;i<a.length;i+=4)if(a[i]>150&&a[i+1]>40&&a[i+1]<245&&a[i+2]<100&&a[i+3]){
     const xx=i/4%240,yy=Math.floor(i/4/240);count++;minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);
     if(xx<left-s+2*u||xx>=left+s-2*u||yy<base-12*u||yy>=base-u)outside=true;
    }
    check(count>0&&!outside,name+' visible flame stays inside the stone opening at '+t);
    check(maxY-minY>s*.65,name+' fire remains substantial beside person-sized furnishings at '+t);
   }
  }
 }finally{AMB.fire=fire;g.clip=clip;}
return checks;
}.toString()+')()');}